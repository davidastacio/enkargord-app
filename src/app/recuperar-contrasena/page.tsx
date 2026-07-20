"use client";

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Mail, ArrowLeft } from 'lucide-react';

import AuthHeader from '@/components/auth/AuthHeader';
import AuthVisual from '@/components/auth/AuthVisual';
import LoadingButton from '@/components/auth/LoadingButton';
import FormError from '@/components/auth/FormError';

export default function RecoverPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError(null);

    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      setEmailError("Ingrese una dirección de correo electrónico válida.");
      return;
    }

    setIsLoading(true);

    // Simulate password recovery dispatch API
    setTimeout(() => {
      setIsLoading(false);
      setIsSent(true);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FB] flex flex-col pt-20 font-sans">
      <AuthHeader />

      <div className="flex-grow max-w-7xl mx-auto w-full px-6 py-12 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        
        {/* Visual promo column */}
        <div className="lg:col-span-7 flex justify-center">
          <AuthVisual 
            badge="Recuperación de contraseña"
            title="Recupera el acceso a tu cuenta de envíos."
            description="Ingresa tu correo registrado y te enviaremos un enlace de recuperación seguro para restablecer tu contraseña al instante."
          />
        </div>

        {/* Form card column */}
        <div className="lg:col-span-5 flex justify-center">
          <div className="bg-white border border-[#E7E7EC] rounded-[18px] p-8 w-full max-w-md shadow-sm space-y-6">
            
            {isSent ? (
              <div className="text-center space-y-6 py-6 animate-scale-up">
                <div className="w-16 h-16 bg-[#fee2e2] text-[#d3121a] rounded-full flex items-center justify-center mx-auto text-3xl">
                  ✉️
                </div>
                <div className="space-y-2">
                  <h3 className="font-extrabold text-slate-900 text-lg">Enlace de recuperación enviado</h3>
                  <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                    Si el correo <strong>{email}</strong> está registrado en EnkargoRD, recibirás un enlace de recuperación seguro en unos minutos.
                  </p>
                </div>
                <div className="pt-2">
                  <Link 
                    href="/login" 
                    className="w-full bg-[#d3121a] hover:bg-[#b00f14] text-white font-extrabold text-xs py-3.5 px-4 rounded-xl transition-all shadow-md shadow-red-100 flex items-center justify-center"
                  >
                    Regresar al login
                  </Link>
                </div>
              </div>
            ) : (
              <>
                <div className="text-center space-y-2">
                  <div className="relative w-28 h-10 mx-auto">
                    <Image 
                      src="/logo.png" 
                      alt="EnkargoRD Logo" 
                      fill 
                      className="object-contain"
                      priority
                    />
                  </div>
                  <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                    ¿Olvidaste tu contraseña?
                  </h2>
                  <p className="text-xs text-slate-400 font-semibold">
                    No te preocupes. Ingresa tu correo electrónico para restablecerla.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-1.5 w-full">
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                      Correo electrónico
                    </label>
                    <div className="relative">
                      <Mail size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        type="email" 
                        placeholder="ejemplo@correo.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={`w-full pl-11 pr-4 py-3 bg-white border ${
                          emailError ? 'border-red-500' : 'border-[#E7E7EC]'
                        } rounded-xl text-xs font-semibold focus:outline-none focus:border-[#d3121a] transition-all`}
                      />
                    </div>
                    {emailError && <span className="text-[10px] font-bold text-red-500 block pl-1">{emailError}</span>}
                  </div>

                  <div className="pt-2">
                    <LoadingButton 
                      isLoading={isLoading} 
                      text="Enviar enlace" 
                    />
                  </div>
                </form>

                <div className="text-center pt-2">
                  <Link 
                    href="/login" 
                    className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
                  >
                    <ArrowLeft size={14} />
                    <span>Regresar a Iniciar sesión</span>
                  </Link>
                </div>
              </>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}
