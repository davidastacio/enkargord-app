"use client";

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Package, 
  PlusCircle, 
  ListOrdered, 
  Map, 
  Users, 
  BarChart2, 
  CreditCard, 
  Settings, 
  Menu,
  X,
  Bell, 
  ChevronDown,
  Calendar,
  HelpCircle,
  Smartphone
} from 'lucide-react';
import RouteGuard from '@/components/auth/RouteGuard';
import AuthenticatedUserMenu from '@/components/auth/AuthenticatedUserMenu';
import { useAuth } from '@/hooks/useAuth';
import LogoutButton from '@/components/auth/LogoutButton';
import CompleteProfileModal from '@/components/auth/CompleteProfileModal';

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { profile, isImpersonating } = useAuth() as any;
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isIncompleteProfile =
    !isImpersonating &&
    !!profile &&
    (!profile.phone || profile.name === 'Usuario EnkargoRD' || !profile.name);

  const menuItems = [
    { name: 'Dashboard Tienda', href: '/tienda', icon: Package },
    { name: 'Crear Pedido', href: '/tienda/crear-pedido', icon: PlusCircle },
    { name: 'Mis Pedidos', href: '/tienda/pedidos', icon: ListOrdered },
    { name: 'Seguimiento', href: '/tienda/seguimiento', icon: Map },
    { name: 'Clientes', href: '/tienda/clientes', icon: Users },
    { name: 'Reportes', href: '/tienda/reportes', icon: BarChart2 },
    { name: 'Pagos y Cobros', href: '/tienda/pagos', icon: CreditCard },
    { name: 'Configuración', href: '/tienda/configuracion', icon: Settings },
  ];

  return (
    <RouteGuard allowedRoles={['Tienda', 'Admin']}>
      <div className="min-h-screen bg-[#F8F9FB] flex font-sans text-slate-800 antialiased">
      {sidebarOpen && (
        <button type="button" aria-label="Cerrar menú" onClick={() => setSidebarOpen(false)} className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-sm lg:hidden" />
      )}
      
      {/* ==========================================
         LEFT SIDEBAR
         ========================================== */}
      <aside className={`${sidebarOpen ? 'flex' : 'hidden'} lg:flex w-[min(280px,86vw)] lg:w-[280px] bg-white border-r border-[#E7E7EC] flex-col justify-between fixed top-0 bottom-0 left-0 z-50`}>
        <div>
          {/* Logo Header */}
          <div className="p-4 border-b border-[#E7E7EC] flex items-center justify-center">
            <div className="relative h-12 w-[220px]">
              <Image 
                src="/logo-horizontal.png" 
                alt="EnkargoRD Logo" 
                fill 
                className="object-contain object-center" 
                priority
              />
            </div>
            <button type="button" onClick={() => setSidebarOpen(false)} className="p-2 lg:hidden" aria-label="Cerrar menú">
              <X size={20} />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-[#d3121a] text-white shadow-md shadow-red-100'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Icon size={18} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer Cards */}
        <div className="p-4 border-t border-[#E7E7EC] space-y-4">
          
          <button
            onClick={() => {
              if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('trigger-pwa-install'));
              }
            }}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-[11px] py-2.5 px-4 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
          >
            <Smartphone size={14} className="text-emerald-400" />
            <span>Instalar App Web</span>
          </button>

          {/* Support Widget */}
          <div className="p-4 bg-slate-50 border border-[#E7E7EC] rounded-2xl text-center space-y-3">
            <div className="w-10 h-10 bg-[#fee2e2] text-[#d3121a] rounded-full flex items-center justify-center mx-auto">
              <HelpCircle size={20} />
            </div>
            <div>
              <h5 className="font-bold text-xs text-slate-800">¿Necesitas ayuda?</h5>
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Nuestro equipo está disponible 24/7</p>
            </div>
            <a 
              href="https://wa.me/18296564603"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-[#d3121a] hover:bg-[#b00f14] text-white font-extrabold text-[10px] py-2.5 px-4 rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5"
            >
              Contactar soporte
            </a>
          </div>

          <LogoutButton
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-500 hover:text-red-600 hover:bg-red-50 transition-all"
          >
            Cerrar sesión
          </LogoutButton>
        </div>
      </aside>

      {/* ==========================================
         MAIN WRAPPER & HEADER
         ========================================== */}
      <div className="flex-grow min-w-0 pl-0 lg:pl-[280px] min-h-screen flex flex-col">
        
        <header className="bg-white border-b border-[#E7E7EC] px-4 sm:px-6 lg:px-8 py-4 sm:py-5 flex flex-wrap items-center justify-between gap-3 sticky top-0 z-30">
          <div className="flex items-center gap-3 min-w-0">
            <button type="button" onClick={() => setSidebarOpen(true)} className="p-2 border border-[#E7E7EC] rounded-xl lg:hidden" aria-label="Abrir menú">
              <Menu size={19} />
            </button>
            <div className="min-w-0">
            <h1 className="text-xl font-extrabold text-slate-950 tracking-tight">
              ¡Bienvenido, {profile?.name || 'Tienda'}!
            </h1>
            <p className="text-xs text-slate-400 mt-1 font-medium">
              Este es el panel de operaciones de tu tienda. Gestiona tus pedidos y envíos.
            </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 lg:gap-5 ml-auto">
            {/* Date Widget */}
            <div className="hidden md:flex items-center gap-2 border border-[#E7E7EC] px-3.5 py-2.5 rounded-xl bg-slate-50 text-xs font-bold text-slate-600">
              <Calendar size={14} className="text-[#d3121a]" />
              <span>{new Date().toLocaleDateString('es-DO', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
            </div>

            {/* Notification Widget */}
            <button className="relative p-2.5 border border-[#E7E7EC] rounded-xl hover:bg-slate-50 transition-colors">
              <Bell size={16} className="text-slate-600" />
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-[#d3121a] rounded-full border-2 border-white"></span>
            </button>

            {/* User Profile */}
            <AuthenticatedUserMenu />

            {/* Quick Action */}
            <Link
              href="/tienda/crear-pedido"
              className="bg-[#d3121a] hover:bg-[#b00f14] text-white font-extrabold text-xs py-2.5 sm:py-3 px-3 sm:px-5 rounded-xl shadow-md shadow-red-100 transition-all flex items-center gap-2"
            >
              <span className="sm:hidden">+ Pedido</span><span className="hidden sm:inline">+ Crear Pedido</span>
            </Link>
          </div>
        </header>

        {/* Content Wrapper */}
        <main className="p-4 sm:p-6 lg:p-8 flex-grow min-w-0 overflow-x-hidden">
          <CompleteProfileModal isOpen={isIncompleteProfile} />
          {children}
        </main>

      </div>
    </div>
    </RouteGuard>
  );
}
