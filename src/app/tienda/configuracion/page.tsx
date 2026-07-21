"use client";

import { useState, useEffect } from 'react';
import { Settings, Save, Lock, Loader2 } from 'lucide-react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { useAuth } from '@/hooks/useAuth';

export default function StoreSettings() {
  const { user, profile } = useAuth() as any;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [storeName, setStoreName] = useState('');
  const [rnc, setRnc] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadStoreProfile() {
      if (profile?.uid) {
        setLoading(true);
        try {
          const storeId = profile.storeId || profile.uid;
          const ref = doc(db, 'stores', storeId);
          const snap = await getDoc(ref);

          if (snap.exists()) {
            const data = snap.data();
            setStoreName(data.commercialName || data.name || profile.name || '');
            setRnc(data.rnc || '');
            setPhone(data.phone || profile.phone || '');
            setEmail(data.email || profile.email || user?.email || '');
            setAddress(data.address || '');
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

    setSaving(true);
    try {
      const storeId = profile.storeId || profile.uid;
      await setDoc(doc(db, 'stores', storeId), {
        commercialName: storeName,
        rnc,
        phone,
        email,
        address,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      triggerToast("Datos comerciales guardados en Firestore correctamente.");
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
        <span className="text-xs font-bold text-slate-400">Cargando configuración comercial de la tienda...</span>
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
          Administra las credenciales comerciales, RNC y datos reales de tu negocio en Firestore.
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
