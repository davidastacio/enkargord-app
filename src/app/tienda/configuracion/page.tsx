"use client";

import { useState } from 'react';
import { Settings, Save, Lock, Bell } from 'lucide-react';

export default function StoreSettings() {
  const [storeName, setStoreName] = useState('Moda Express RD');
  const [rnc, setRnc] = useState('131-12345-6');
  const [phone, setPhone] = useState('809-555-8888');
  const [email, setEmail] = useState('contacto@modaexpress.do');
  const [address, setAddress] = useState('Av. Winston Churchill #12, Naco, Santo Domingo');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    triggerToast("Datos comerciales actualizados correctamente.");
  };

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      alert("Por favor rellene todos los campos de contraseña.");
      return;
    }
    triggerToast("Contraseña actualizada con éxito.");
    setCurrentPassword('');
    setNewPassword('');
  };

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
          Administra las credenciales comerciales, RNC y preferencias de alertas de tu negocio.
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
                  className="w-full px-4 py-2.5 bg-white border border-[#E7E7EC] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#d3121a] transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Teléfono comercial</label>
                <input 
                  type="text" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
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
                className="w-full px-4 py-2.5 bg-white border border-[#E7E7EC] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#d3121a] transition-all"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Dirección Principal</label>
              <input 
                type="text" 
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-[#E7E7EC] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#d3121a] transition-all"
              />
            </div>

            <button 
              type="submit" 
              className="bg-[#d3121a] hover:bg-[#b00f14] text-white font-extrabold text-xs py-3 px-5 rounded-xl transition-all shadow-md shadow-red-100 flex items-center gap-2"
            >
              <Save size={14} />
              Guardar cambios
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
