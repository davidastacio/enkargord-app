"use client";

import { useState, useEffect } from 'react';
import { Settings, Save, Lock, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { getSupabaseStore, updateSupabaseStore } from '@/lib/supabase/stores';

export default function StoreSettings() {
  const { user, profile, refreshProfile } = useAuth() as any;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [storeName, setStoreName] = useState('');
  const [rnc, setRnc] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountType, setAccountType] = useState<'Ahorros' | 'Corriente'>('Ahorros');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadStoreProfile() {
      if (profile?.uid) {
        setLoading(true);
        try {
          const storeId = profile.storeId || profile.uid;
          const data = await getSupabaseStore(storeId);

          if (data) {
            setStoreName(data.commercialName || profile.name || '');
            setRnc(String(data.settings?.rnc || ''));
            setPhone(data.phone || profile.phone || '');
            setEmail(data.email || profile.email || user?.email || '');
            setAddress(data.address || '');
            const bank = (data.settings?.bankAccount || {}) as Record<string, unknown>;
            setBankName(String(bank.bankName || ''));
            setAccountHolder(String(bank.accountHolder || ''));
            setAccountNumber(String(bank.accountNumber || ''));
            setAccountType(bank.accountType === 'Corriente' ? 'Corriente' : 'Ahorros');
          } else {
            setStoreName(profile.name || '');
            setPhone(profile.phone || '');
            setEmail(profile.email || user?.email || '');
          }
        } catch (err) {
          console.error("Error loading store profile settings:", err);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    }
    loadStoreProfile();
  }, [profile, user]);

  const triggerToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.uid) return;
    const normalizedStoreName = storeName.trim();
    if (!normalizedStoreName) {
      triggerToast("El nombre comercial es obligatorio.");
      return;
    }

    setSaving(true);
    try {
      const storeId = profile.storeId || profile.uid;
      await updateSupabaseStore(storeId, {
        commercialName: normalizedStoreName,
        phone: phone.trim(),
        email: email.trim().toLowerCase(),
        address: address.trim(),
        settings: {
          rnc,
          bankAccount: {
            bankName: bankName.trim(),
            accountHolder: accountHolder.trim(),
            accountNumber: accountNumber.trim(),
            accountType,
          },
        },
      });
      await refreshProfile();

      triggerToast("Datos comerciales guardados correctamente.");
    } catch (err) {
      console.error("Error saving store profile:", err);
      triggerToast("Error al guardar los cambios en la base de datos.");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      alert("Por favor rellene todos los campos de contraseña.");
      return;
    }
    triggerToast("Solicitud enviada para actualizar contraseña.");
    setCurrentPassword('');
    setNewPassword('');
  };

  if (loading) {
    return (
      <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
        <Loader2 size={28} className="animate-spin text-[#d3121a]" />
        <span className="text-xs font-bold text-slate-400">Cargando configuración de la tienda...</span>
      </div>
    );
  }

  if (profile?.role === 'Colaborador') {
    return (
      <div className="py-16 text-center space-y-4 max-w-md mx-auto">
        <div className="w-12 h-12 bg-red-50 text-[#d3121a] rounded-2xl flex items-center justify-center mx-auto">
          <Settings size={24} />
        </div>
        <h3 className="font-extrabold text-slate-900 text-base">Acceso Restringido para Colaboradores</h3>
        <p className="text-xs text-slate-500 font-semibold leading-relaxed">
          Tu cuenta de colaborador no tiene permisos para modificar la configuración de la tienda.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in relative">
      
      {/* Toast popup */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[9999] bg-slate-900 text-white px-5 py-3 rounded-lg shadow-xl flex items-center gap-3 border border-slate-700 animate-slide-in">
          <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div>
        <h2 className="text-xl font-extrabold text-slate-950 tracking-tight">Configuración</h2>
        <p className="text-xs text-slate-400 mt-1 font-medium">
          Administra las credenciales comerciales, RNC y datos reales de tu negocio.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Profile Card Form */}
        <div className="bg-white border border-[#E7E7EC] rounded-2xl p-6 shadow-sm space-y-6">
          <h3 className="font-extrabold text-slate-900 text-sm border-b border-slate-100 pb-2">
            🏪 Perfil Comercial de la Tienda
          </h3>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Nombre Comercial</label>
              <input 
                type="text" 
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder="Ej. Mi Tienda RD"
                className="w-full px-4 py-2.5 bg-white border border-[#E7E7EC] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#d3121a] transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">RNC</label>
                <input 
                  type="text" 
                  value={rnc}
                  onChange={(e) => setRnc(e.target.value)}
                  placeholder="000-00000-0"
                  className="w-full px-4 py-2.5 bg-white border border-[#E7E7EC] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#d3121a] transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Teléfono comercial</label>
                <input 
                  type="text" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+18095550000"
                  className="w-full px-4 py-2.5 bg-white border border-[#E7E7EC] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#d3121a] transition-all"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Correo de contacto</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contacto@mitienda.do"
                className="w-full px-4 py-2.5 bg-white border border-[#E7E7EC] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#d3121a] transition-all"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Dirección Principal</label>
              <input 
                type="text" 
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Calle Central #1, Santo Domingo"
                className="w-full px-4 py-2.5 bg-white border border-[#E7E7EC] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#d3121a] transition-all"
              />
            </div>

            <div className="border-t border-slate-100 pt-4">
              <h4 className="mb-3 text-xs font-extrabold text-slate-800">Cuenta bancaria para recibir liquidaciones</h4>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Banco</label>
                  <input type="text" value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="Ej. Banco Popular" className="w-full rounded-xl border border-[#E7E7EC] px-4 py-2.5 text-xs font-semibold focus:border-[#d3121a] focus:outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Tipo de cuenta</label>
                  <select value={accountType} onChange={(e) => setAccountType(e.target.value as 'Ahorros' | 'Corriente')} className="w-full rounded-xl border border-[#E7E7EC] px-4 py-2.5 text-xs font-semibold focus:border-[#d3121a] focus:outline-none">
                    <option value="Ahorros">Ahorros</option>
                    <option value="Corriente">Corriente</option>
                  </select>
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Titular de la cuenta</label>
                  <input type="text" value={accountHolder} onChange={(e) => setAccountHolder(e.target.value)} placeholder="Nombre completo o razón social" className="w-full rounded-xl border border-[#E7E7EC] px-4 py-2.5 text-xs font-semibold focus:border-[#d3121a] focus:outline-none" />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Número de cuenta</label>
                  <input type="text" inputMode="numeric" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value.replace(/[^\d-]/g, ''))} placeholder="Número de cuenta bancaria" className="w-full rounded-xl border border-[#E7E7EC] px-4 py-2.5 font-mono text-xs font-semibold focus:border-[#d3121a] focus:outline-none" />
                </div>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={saving}
              className="bg-[#d3121a] hover:bg-[#b00f14] text-white font-extrabold text-xs py-3 px-5 rounded-xl transition-all shadow-md shadow-red-100 flex items-center gap-2 disabled:opacity-50"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </button>

          </form>
        </div>

        {/* Security Password form Card */}
        <div className="bg-white border border-[#E7E7EC] rounded-2xl p-6 shadow-sm space-y-6">
          <h3 className="font-extrabold text-slate-900 text-sm border-b border-slate-100 pb-2">
            🔒 Seguridad y Acceso
          </h3>

          <form onSubmit={handleUpdatePassword} className="space-y-4">
            
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Contraseña actual</label>
              <input 
                type="password" 
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-[#E7E7EC] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#d3121a] transition-all"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Nueva contraseña</label>
              <input 
                type="password" 
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-[#E7E7EC] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#d3121a] transition-all"
              />
            </div>

            <button 
              type="submit" 
              className="bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs py-3 px-5 rounded-xl transition-all flex items-center gap-2"
            >
              <Lock size={14} />
              Actualizar contraseña
            </button>

          </form>
        </div>

      </div>

    </div>
  );
}
