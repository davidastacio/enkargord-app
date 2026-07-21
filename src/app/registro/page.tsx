"use client";

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, User, Phone, CheckSquare } from 'lucide-react';

import { useAuth } from '@/hooks/useAuth';
import { db } from '@/lib/firebase/client';

import AuthHeader from '@/components/auth/AuthHeader';
import AuthVisual from '@/components/auth/AuthVisual';
import PasswordField from '@/components/auth/PasswordField';
import SocialLoginButton from '@/components/auth/SocialLoginButton';
import LoadingButton from '@/components/auth/LoadingButton';
import FormError from '@/components/auth/FormError';

export default function RegisterPage() {
  const router = useRouter();
  const { registerUser } = useAuth();
  
  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'Cliente' | 'Tienda'>('Cliente');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  // Loading, success & error states
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isVerificationSent, setIsVerificationSent] = useState(false);

  // Field validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Password strength calculation
  const getPasswordStrength = () => {
    if (!password) return { label: 'Muy débil', color: 'bg-slate-200', width: 'w-1/12' };
    
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;

    if (score <= 1) return { label: 'Débil', color: 'bg-red-500', width: 'w-3/12' };
    if (score === 2) return { label: 'Media', color: 'bg-amber-500', width: 'w-6/12' };
    if (score === 3) return { label: 'Segura', color: 'bg-blue-500', width: 'w-9/12' };
    return { label: 'Muy Fuerte', color: 'bg-emerald-500', width: 'w-full' };
  };

  const validateDominicanPhone = (num: string) => {
    // Basic format filter
    const cleaned = num.replace(/\D/g, '');
    return cleaned.length === 10 && (cleaned.startsWith('809') || cleaned.startsWith('829') || cleaned.startsWith('849'));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setErrors({});

    const fieldErrors: Record<string, string> = {};

    if (!name.trim()) fieldErrors.name = "El nombre completo es obligatorio.";
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) fieldErrors.email = "Ingrese un correo electrónico válido.";
    
    if (!phone.trim()) {
      fieldErrors.phone = "El teléfono es obligatorio.";
    } else if (!validateDominicanPhone(phone)) {
      fieldErrors.phone = "Ingrese un número dominicano válido (809, 829 o 849).";
    }

    if (password.length < 8) {
      fieldErrors.password = "La contraseña debe tener al menos 8 caracteres.";
    } else if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
      fieldErrors.password = "Debe contener mayúscula, minúscula y número.";
    }

    if (password !== confirmPassword) {
      fieldErrors.confirmPassword = "Las contraseñas no coinciden.";
    }

    if (!acceptedTerms) {
      fieldErrors.acceptedTerms = "Debes aceptar los Términos y Condiciones.";
    }

    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);

    try {
      const cleanedPhone = phone.replace(/\D/g, '');
      // Create user in Firebase Auth & Firestore
      await registerUser(email, password, name, cleanedPhone, role);
      setIsVerificationSent(true);
    } catch (error: any) {
      console.error('Registration error:', error);
      let errMsg = 'Ocurrió un error al registrar la cuenta. Por favor, inténtelo de nuevo.';
      if (error.code === 'auth/email-already-in-use') {
        errMsg = 'El correo electrónico ingresado ya está en uso por otra cuenta.';
      } else if (error.code === 'auth/weak-password') {
        errMsg = 'La contraseña ingresada es demasiado débil.';
      } else if (error.message) {
        errMsg = error.message;
      }
      setErrorMsg(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const strength = getPasswordStrength();

  return (
    <div className="min-h-screen bg-[#F8F9FB] flex flex-col pt-20 font-sans">
      <AuthHeader />

      <div className="flex-grow max-w-7xl mx-auto w-full px-6 py-12 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        
        {/* Left column visual */}
        <div className="lg:col-span-7 flex justify-center">
          <AuthVisual 
            badge="Únete a EnkargoRD"
            title="Crea tu cuenta y empieza a mover lo que importa."
            description="Regístrate en EnkargoRD y únete a personas y negocios que confían en nosotros para entregar más, llegar lejos y crecer juntos."
          />
        </div>

        {/* Right column form card */}
        <div className="lg:col-span-5 flex justify-center">
          <div className="bg-white border border-[#E7E7EC] rounded-[18px] p-8 w-full max-w-md shadow-sm space-y-6">
            
            {isVerificationSent ? (
              // Verification sent mockup page
              <div className="text-center space-y-6 py-6 animate-scale-up">
                <div className="w-16 h-16 bg-[#fee2e2] text-[#d3121a] rounded-full flex items-center justify-center mx-auto text-3xl">
                  ✉️
                </div>
                <div className="space-y-2">
                  <h3 className="font-extrabold text-slate-900 text-lg">Revisa tu correo para verificar tu cuenta</h3>
                  <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                    Hemos enviado un correo de confirmación a <strong>{email}</strong>. Por favor, haz clic en el enlace del correo para activar tu perfil de {role}.
                  </p>
                </div>
                <div className="pt-2">
                  <Link 
                    href="/login" 
                    className="w-full bg-[#d3121a] hover:bg-[#b00f14] text-white font-extrabold text-xs py-3.5 px-4 rounded-xl transition-all shadow-md shadow-red-100 flex items-center justify-center"
                  >
                    Ir al inicio de sesión
                  </Link>
                </div>
              </div>
            ) : (
              // Standard registration form
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
                    Regístrate
                  </h2>
                  <p className="text-xs text-slate-400 font-semibold">
                    Completa tus datos para crear tu cuenta.
                  </p>
                </div>

                {/* DIAGNÓSTICO EN VIVO TEMPORAL */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-[10px] font-mono text-slate-600 space-y-1">
                  <div>🌍 Entorno: production</div>
                  <div>🆔 Proyecto Firebase: {db?.app?.options?.projectId || 'No definido'}</div>
                  <div>🔥 Firestore Inicializado: {db ? 'SÍ (Activo)' : 'NO (Error)'}</div>
                </div>

                <FormError message={errorMsg} />

                <form onSubmit={handleSubmit} className="space-y-4">
                  
                  {/* Name field */}
                  <div className="space-y-1.5 w-full">
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                      Nombre completo
                    </label>
                    <div className="relative">
                      <User size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        type="text" 
                        placeholder="Ingresa tu nombre completo"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className={`w-full pl-11 pr-4 py-3 bg-white border ${
                          errors.name ? 'border-red-500' : 'border-[#E7E7EC]'
                        } rounded-xl text-xs font-semibold focus:outline-none focus:border-[#d3121a] transition-all`}
                      />
                    </div>
                    {errors.name && <span className="text-[10px] font-bold text-red-500 block pl-1">{errors.name}</span>}
                  </div>

                  {/* Contact grid fields */}
                  <div className="grid grid-cols-2 gap-4">
                    
                    {/* Email */}
                    <div className="space-y-1.5">
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
                            errors.email ? 'border-red-500' : 'border-[#E7E7EC]'
                          } rounded-xl text-xs font-semibold focus:outline-none focus:border-[#d3121a] transition-all`}
                        />
                      </div>
                      {errors.email && <span className="text-[10px] font-bold text-red-500 block pl-1">{errors.email}</span>}
                    </div>

                    {/* Phone */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                        Teléfono
                      </label>
                      <div className="relative">
                        <Phone size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input 
                          type="text" 
                          placeholder="809-123-4567"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className={`w-full pl-11 pr-4 py-3 bg-white border ${
                            errors.phone ? 'border-red-500' : 'border-[#E7E7EC]'
                          } rounded-xl text-xs font-semibold focus:outline-none focus:border-[#d3121a] transition-all`}
                        />
                      </div>
                      {errors.phone && <span className="text-[10px] font-bold text-red-500 block pl-1">{errors.phone}</span>}
                    </div>

                  </div>

                  {/* Account Type dropdown */}
                  <div className="space-y-1.5 w-full">
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                      Tipo de cuenta
                    </label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value as any)}
                      className="w-full bg-white border border-[#E7E7EC] rounded-xl px-4 py-3 text-xs font-semibold focus:outline-none focus:border-[#d3121a] transition-all"
                    >
                      <option value="Cliente">Cliente</option>
                      <option value="Tienda">Tienda / Negocio</option>
                    </select>
                  </div>

                  {/* Password fields grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <PasswordField 
                      label="Contraseña"
                      placeholder="Crea una contraseña"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      error={errors.password}
                    />

                    <PasswordField 
                      label="Confirmar contraseña"
                      placeholder="Confirma tu contraseña"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      error={errors.confirmPassword}
                    />
                  </div>

                  {/* Password strength meter */}
                  {password && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[9px] font-bold text-slate-400">
                        <span>Fortaleza de contraseña:</span>
                        <span className="text-slate-600">{strength.label}</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full ${strength.color} ${strength.width} transition-all duration-300`}></div>
                      </div>
                    </div>
                  )}

                  {/* Legal Terms Checkbox */}
                  <div className="space-y-1">
                    <label className="flex items-start gap-2.5 cursor-pointer text-[10px] font-bold text-slate-500 pt-1 leading-normal select-none">
                      <input 
                        type="checkbox"
                        checked={acceptedTerms}
                        onChange={(e) => setAcceptedTerms(e.target.checked)}
                        className="w-4 h-4 accent-[#d3121a] rounded border-[#E7E7EC] mt-0.5"
                      />
                      <span>
                        Acepto los{' '}
                        <Link href="/terminos" className="text-[#d3121a] hover:underline">
                          Términos y Condiciones
                        </Link>{' '}
                        y la{' '}
                        <Link href="/privacidad" className="text-[#d3121a] hover:underline">
                          Política de Privacidad
                        </Link>
                        .
                      </span>
                    </label>
                    {errors.acceptedTerms && <span className="text-[10px] font-bold text-red-500 block pl-1">{errors.acceptedTerms}</span>}
                  </div>

                  {/* Loading submit button */}
                  <div className="pt-2">
                    <LoadingButton 
                      isLoading={isLoading} 
                      text="Crear cuenta" 
                    />
                  </div>

                </form>

                <div className="relative flex items-center justify-center my-4">
                  <span className="absolute w-full border-t border-[#E7E7EC]"></span>
                  <span className="relative bg-white px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    o continúa con
                  </span>
                </div>

                {/* Social Google */}
                <SocialLoginButton 
                  text="Continuar con Google"
                  onClick={() => alert("Simulación: Creación de cuenta con Google...")}
                />

                {/* Return to Login */}
                <div className="text-center text-xs font-semibold text-slate-500 pt-2">
                  ¿Ya tienes cuenta?{' '}
                  <Link 
                    href="/login" 
                    className="text-[#d3121a] hover:underline font-extrabold"
                  >
                    Inicia sesión
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
