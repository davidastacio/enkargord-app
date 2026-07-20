"use client";

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShieldCheck } from 'lucide-react';

import AuthHeader from '@/components/auth/AuthHeader';
import AuthVisual from '@/components/auth/AuthVisual';
import PasswordField from '@/components/auth/PasswordField';
import LoadingButton from '@/components/auth/LoadingButton';
import FormError from '@/components/auth/FormError';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Field validation errors
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setConfirmPasswordError(null);

    let hasError = false;

    if (password.length < 8) {
      setPasswordError("La contraseña debe tener al menos 8 caracteres.");
      hasError = true;
    } else if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
      setPasswordError("Debe contener mayúscula, minúscula y número.");
      hasError = true;
    }

    if (password !== confirmPassword) {
      setConfirmPasswordError("Las contraseñas no coinciden.");
      hasError = true;
    }

    if (hasError) return;

    setIsLoading(true);

    // Simulate password restore API
    setTimeout(() => {
      setIsLoading(false);
      setIsSuccess(true);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FB] flex flex-col pt-20 font-sans">
      <AuthHeader />

      <div className="flex-grow max-w-7xl mx-auto w-full px-6 py-12 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        
        {/* Visual column */}
        <div className="lg:col-span-7 flex justify-center">
          <AuthVisual 
            badge="Restablecer contraseña"
            title="Crea una nueva contraseña segura."
            description="Asegúrate de combinar mayúsculas, minúsculas y números para garantizar la máxima seguridad en tu cuenta."
          />
        </div>

        {/* Form card */}
        <div className="lg:col-span-5 flex justify-center">
          <div className="bg-white border border-[#E7E7EC] rounded-[18px] p-8 w-full max-w-md shadow-sm space-y-6">
            
            {isSuccess ? (
              <div className="text-center space-y-6 py-6 animate-scale-up">
                <div className="w-16 h-16 bg-[#fee2e2] text-[#d3121a] rounded-full flex items-center justify-center mx-auto">
                  <ShieldCheck size={32} />
                </div>
                <div className="space-y-2">
                  <h3 className="font-extrabold text-slate-900 text-lg">Contraseña restablecida</h3>
                  <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                    Tu contraseña ha sido actualizada con éxito. Ya puedes iniciar sesión con tus nuevas credenciales de acceso.
                  </p>
                </div>
                <div className="pt-2">
                  <Link 
                    href="/login" 
                    className="w-full bg-[#d3121a] hover:bg-[#b00f14] text-white font-extrabold text-xs py-3.5 px-4 rounded-xl transition-all shadow-md shadow-red-100 flex items-center justify-center"
                  >
                    Iniciar sesión
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
                    Restablecer clave
                  </h2>
                  <p className="text-xs text-slate-400 font-semibold">
                    Crea tu nueva contraseña de acceso segura.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  
                  <PasswordField 
                    label="Nueva contraseña"
                    placeholder="Ingresa tu nueva contraseña"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    error={passwordError || undefined}
                  />

                  <PasswordField 
                    label="Confirmar nueva contraseña"
                    placeholder="Confirma la contraseña"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    error={confirmPasswordError || undefined}
                  />

                  <div className="pt-2">
                    <LoadingButton 
                      isLoading={isLoading} 
                      text="Restablecer contraseña" 
                    />
                  </div>
                </form>
              </>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}
