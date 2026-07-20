"use client";

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, HelpCircle } from 'lucide-react';

import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { useAuth } from '@/hooks/useAuth';

import AuthHeader from '@/components/auth/AuthHeader';
import AuthVisual from '@/components/auth/AuthVisual';
import PasswordField from '@/components/auth/PasswordField';
import SocialLoginButton from '@/components/auth/SocialLoginButton';
import LoadingButton from '@/components/auth/LoadingButton';
import FormError from '@/components/auth/FormError';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Field validations
  const [identifierError, setIdentifierError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIdentifierError(null);
    setPasswordError(null);

    let hasError = false;

    if (!identifier.trim()) {
      setIdentifierError("El correo electrónico o teléfono es obligatorio.");
      hasError = true;
    }
    if (!password) {
      setPasswordError("La contraseña es obligatoria.");
      hasError = true;
    }

    if (hasError) return;

    setIsLoading(true);

    try {
      let emailToAuth = identifier.trim();

      // If it looks like a phone number (digits, dashes, parens), resolve it to email
      const isPhonePattern = /^[0-9\-()+ ]+$/.test(emailToAuth) && emailToAuth.replace(/\D/g, '').length >= 7;
      if (isPhonePattern) {
        const cleanedPhone = emailToAuth.replace(/\D/g, '');
        // Search user profile by phone in Firestore
        const q = query(collection(db, 'users'), where('phone', '==', cleanedPhone));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const userDoc = querySnapshot.docs[0];
          emailToAuth = userDoc.data().email;
        } else {
          // Try also searching by raw digits without formatting if not found
          const q2 = query(collection(db, 'users'), where('phone', '==', emailToAuth));
          const querySnapshot2 = await getDocs(q2);
          if (!querySnapshot2.empty) {
            emailToAuth = querySnapshot2.docs[0].data().email;
          }
        }
      }

      // Perform real auth
      const userProfile = await login(emailToAuth, password);

      // Redirect depending on user role
      if (userProfile.role === 'Admin') {
        router.push('/admin');
      } else if (userProfile.role === 'Tienda') {
        router.push('/tienda');
      } else if (userProfile.role === 'Motorista') {
        router.push('/motorista');
      } else {
        router.push('/');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      let errMsg = 'Las credenciales ingresadas son incorrectas o el usuario no existe.';
      if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
        errMsg = 'El correo o la contraseña son incorrectos.';
      } else if (error.code === 'auth/invalid-email') {
        errMsg = 'El formato del correo electrónico ingresado no es válido.';
      } else if (error.message) {
        errMsg = error.message;
      }
      setErrorMsg(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FB] flex flex-col pt-20 font-sans">
      <AuthHeader />

      <div className="flex-grow max-w-7xl mx-auto w-full px-6 py-12 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        
        {/* Left column visual */}
        <div className="lg:col-span-7 flex justify-center">
          <AuthVisual 
            badge="Rápido. Seguro. Confiable."
            title="Inicia sesión y sigue entregando lo que importa."
            description="Con EnkargoRD gestionas tus envíos en tiempo real, con total seguridad y al mejor tiempo."
          />
        </div>

        {/* Right column form card */}
        <div className="lg:col-span-5 flex justify-center">
          <div className="bg-white border border-[#E7E7EC] rounded-[18px] p-8 w-full max-w-md shadow-sm space-y-6">
            
            {/* Header info */}
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
                Iniciar sesión
              </h2>
              <p className="text-xs text-slate-400 font-semibold">
                Bienvenido de nuevo. Ingresa tus datos para acceder a tu cuenta.
              </p>
            </div>

            <FormError message={errorMsg} />

            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Identifier field */}
              <div className="space-y-1.5 w-full">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                  Correo electrónico o teléfono
                </label>
                <div className="relative">
                  <Mail size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="ejemplo@correo.com o 809-123-4567"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className={`w-full pl-11 pr-4 py-3 bg-white border ${
                      identifierError ? 'border-red-500' : 'border-[#E7E7EC]'
                    } rounded-xl text-xs font-semibold focus:outline-none focus:border-[#d3121a] transition-all`}
                  />
                </div>
                {identifierError && <span className="text-[10px] font-bold text-red-500 block pl-1">{identifierError}</span>}
              </div>

              {/* Password field */}
              <PasswordField 
                label="Contraseña"
                placeholder="Ingresa tu contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={passwordError || undefined}
              />

              {/* Remember me & recovery link */}
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input 
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 accent-[#d3121a] rounded border-[#E7E7EC]"
                  />
                  <span>Recordarme</span>
                </label>

                <Link 
                  href="/recuperar-contrasena" 
                  className="text-[#d3121a] hover:underline"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>

              {/* Action trigger */}
              <div className="pt-2">
                <LoadingButton 
                  isLoading={isLoading} 
                  text="Iniciar sesión" 
                />
              </div>
            </form>

            <div className="relative flex items-center justify-center my-4">
              <span className="absolute w-full border-t border-[#E7E7EC]"></span>
              <span className="relative bg-white px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                o continúa con
              </span>
            </div>

            {/* Social Authentication */}
            <SocialLoginButton 
              text="Continuar con Google" 
              onClick={() => alert("Simulación: Inicio de sesión social con Google...")}
            />

            {/* Register redirection */}
            <div className="text-center text-xs font-semibold text-slate-500 pt-2">
              ¿No tienes cuenta?{' '}
              <Link 
                href="/registro" 
                className="text-[#d3121a] hover:underline font-extrabold"
              >
                Regístrate
              </Link>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
