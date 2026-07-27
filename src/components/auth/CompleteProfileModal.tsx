"use client";

import { useState } from 'react';
import { Store, Phone, User, Loader2, Sparkles, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { updateSupabaseStore } from '@/lib/supabase/stores';
import { updateCurrentUserProfile } from '@/lib/supabase/profiles';

interface CompleteProfileModalProps {
  isOpen: boolean;
  onCompleted?: () => void;
}

export default function CompleteProfileModal({ isOpen, onCompleted }: CompleteProfileModalProps) {
  const { user, profile, refreshProfile } = useAuth() as any;

  const [fullName, setFullName] = useState(
    profile?.name && profile?.name !== 'Usuario EnkargoRD' ? profile.name : ''
  );
  const [storeName, setStoreName] = useState('');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const validateDominicanPhone = (num: string) => {
    const cleaned = num.replace(/\D/g, '');
    return cleaned.length === 10 && (cleaned.startsWith('809') || cleaned.startsWith('829') || cleaned.startsWith('849'));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const trimmedName = fullName.trim();
    const trimmedStore = storeName.trim();
    const cleanedPhone = phone.replace(/\D/g, '');

    if (!trimmedName) {
      setErrorMsg('Por favor ingresa tu nombre completo.');
      return;
    }
    if (!trimmedStore) {
      setErrorMsg('Por favor ingresa el nombre de tu negocio o tienda.');
      return;
    }
    if (!phone.trim()) {
      setErrorMsg('El número de teléfono es obligatorio.');
      return;
    }
    if (!validateDominicanPhone(phone)) {
      setErrorMsg('Ingresa un teléfono dominicano válido (809, 829 o 849).');
      return;
    }

    setSaving(true);
    try {
      const storeId = profile?.storeId || `STORE-${crypto.randomUUID().replaceAll('-', '').slice(0, 16).toUpperCase()}`;

      // 1. Save store in Supabase
      await updateSupabaseStore(storeId, {
        commercialName: trimmedStore,
        phone: cleanedPhone,
        email: profile?.email || user?.email || '',
      });

      // 2. Save user profile in Supabase
      const token = await user?.getIdToken();
      if (token) {
        await updateCurrentUserProfile(token, {
          name: trimmedName,
          phone: cleanedPhone,
          email: profile?.email || user?.email || '',
          role: profile?.role || 'Tienda',
          storeId: storeId,
        });
      }

      // 3. Refresh Auth Profile
      await refreshProfile();

      if (onCompleted) onCompleted();
    } catch (err: any) {
      console.error('Error completing profile:', err);
      setErrorMsg(err.message || 'Ocurrió un error al guardar los datos. Intenta nuevamente.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 font-sans animate-fade-in">
      <div className="bg-white border border-[#E7E7EC] rounded-3xl max-w-md w-full shadow-2xl overflow-hidden space-y-6 p-8 relative">
        
        {/* Header Badge */}
        <div className="text-center space-y-3">
          <div className="w-14 h-14 bg-[#fee2e2] text-[#d3121a] rounded-2xl flex items-center justify-center mx-auto shadow-inner">
            <Sparkles size={28} />
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-slate-950 tracking-tight">
              ¡Completa tu perfil comercial!
            </h3>
            <p className="text-xs text-slate-500 font-semibold mt-1 leading-relaxed">
              Para empezar a gestionar y realizar envíos en EnkargoRD, por favor completa los datos clave de tu tienda.
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-bold p-3.5 rounded-xl flex items-center gap-2">
            <span className="w-2 h-2 bg-red-600 rounded-full animate-ping" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Full Name */}
          <div className="space-y-1">
            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
              Tu Nombre Completo
            </label>
            <div className="relative">
              <User size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Ej. Juan Pérez"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-white border border-[#E7E7EC] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#d3121a] transition-all"
              />
            </div>
          </div>

          {/* Store Name */}
          <div className="space-y-1">
            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
              Nombre de tu Negocio / Tienda
            </label>
            <div className="relative">
              <Store size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Ej. Boutique Maria RD"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-white border border-[#E7E7EC] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#d3121a] transition-all"
              />
            </div>
          </div>

          {/* Phone */}
          <div className="space-y-1">
            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
              Teléfono de Contacto (WhatsApp)
            </label>
            <div className="relative">
              <Phone size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Ej. 809-123-4567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-white border border-[#E7E7EC] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#d3121a] transition-all"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-3">
            <button
              type="submit"
              disabled={saving}
              className="w-full bg-[#d3121a] hover:bg-[#b00f14] text-white font-extrabold text-xs py-3.5 px-4 rounded-xl transition-all shadow-md shadow-red-100 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Guardando datos comercial...
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  Guardar y Continuar
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
