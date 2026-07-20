"use client";

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { type UserRole } from '@/providers/AuthProvider';
import { ShieldAlert, Loader2 } from 'lucide-react';

interface RouteGuardProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export default function RouteGuard({ children, allowedRoles = [] }: RouteGuardProps) {
  const { user, role, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      // Redirect to login if user is not authenticated
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    if (allowedRoles.length > 0 && role) {
      // Check if user's role is permitted
      const isAllowed = allowedRoles.includes(role);
      if (!isAllowed) {
        // Direct to their designated landing page based on role
        if (role === 'Admin') {
          router.replace('/admin');
        } else if (role === 'Tienda') {
          router.replace('/tienda');
        } else if (role === 'Motorista') {
          router.replace('/motorista');
        } else {
          router.replace('/');
        }
      }
    }
  }, [user, role, loading, allowedRoles, router, pathname]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FB] flex flex-col items-center justify-center font-sans">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 text-[#d3121a] animate-spin mx-auto" />
          <p className="text-xs text-slate-400 font-extrabold tracking-widest uppercase">
            Verificando credenciales...
          </p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return null;
  }

  // Authenticated but wrong role
  if (allowedRoles.length > 0 && role && !allowedRoles.includes(role)) {
    return (
      <div className="min-h-screen bg-[#F8F9FB] flex flex-col items-center justify-center p-6 font-sans">
        <div className="bg-white border border-[#E7E7EC] rounded-3xl p-8 max-w-md w-full shadow-sm text-center space-y-6">
          <div className="w-16 h-16 bg-[#fee2e2] text-[#d3121a] rounded-2xl flex items-center justify-center mx-auto">
            <ShieldAlert size={32} />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-extrabold text-slate-900">Acceso restringido</h3>
            <p className="text-xs text-slate-500 font-semibold leading-relaxed">
              Tu cuenta de tipo <strong>{role}</strong> no cuenta con los permisos necesarios para acceder a esta sección.
            </p>
          </div>
          <div className="flex flex-col gap-2 pt-2">
            <button
              onClick={() => {
                if (role === 'Admin') router.replace('/admin');
                else if (role === 'Tienda') router.replace('/tienda');
                else if (role === 'Motorista') router.replace('/motorista');
                else router.replace('/');
              }}
              className="w-full bg-[#d3121a] hover:bg-[#b00f14] text-white font-extrabold text-xs py-3.5 px-4 rounded-xl transition-all shadow-md shadow-red-100"
            >
              Ir a mi panel principal
            </button>
            <button
              onClick={() => logout()}
              className="w-full bg-slate-50 hover:bg-slate-100 border border-[#E7E7EC] text-slate-600 font-extrabold text-xs py-3.5 px-4 rounded-xl transition-all"
            >
              Cerrar sesión e iniciar con otra cuenta
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
