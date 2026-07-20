"use client";

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
  LogOut, 
  Bell, 
  ChevronDown,
  Calendar,
  HelpCircle
} from 'lucide-react';

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

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
    <div className="min-h-screen bg-[#F8F9FB] flex font-sans text-slate-800 antialiased">
      
      {/* ==========================================
         LEFT SIDEBAR
         ========================================== */}
      <aside className="w-[280px] bg-white border-r border-[#E7E7EC] flex flex-col justify-between fixed top-0 bottom-0 left-0 z-40">
        <div>
          {/* Logo Header */}
          <div className="p-4 border-b border-[#E7E7EC] flex items-center justify-center">
            <div className="relative w-[270px] h-24">
              <Image 
                src="/logo.png" 
                alt="EnkargoRD Logo" 
                fill 
                className="object-contain object-center" 
                priority
              />
            </div>
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
          
          {/* Support Widget */}
          <div className="p-4 bg-slate-50 border border-[#E7E7EC] rounded-2xl text-center space-y-3">
            <div className="w-10 h-10 bg-[#fee2e2] text-[#d3121a] rounded-full flex items-center justify-center mx-auto">
              <HelpCircle size={20} />
            </div>
            <div>
              <h5 className="font-bold text-xs text-slate-800">¿Necesitas ayuda?</h5>
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Nuestro equipo está disponible 24/7</p>
            </div>
            <button 
              onClick={() => alert("Contactando a soporte de EnkargoRD...")}
              className="w-full bg-[#d3121a] hover:bg-[#b00f14] text-white font-extrabold text-[10px] py-2.5 px-4 rounded-xl transition-all shadow-sm"
            >
              Contactar soporte
            </button>
          </div>

          <Link 
            href="/"
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-500 hover:text-red-600 hover:bg-red-50 transition-all"
          >
            <LogOut size={16} />
            Cerrar sesión
          </Link>
        </div>
      </aside>

      {/* ==========================================
         MAIN WRAPPER & HEADER
         ========================================== */}
      <div className="flex-grow pl-[280px] min-h-screen flex flex-col">
        
        <header className="bg-white border-b border-[#E7E7EC] px-8 py-5 flex items-center justify-between sticky top-0 z-30">
          <div>
            <h1 className="text-xl font-extrabold text-slate-950 tracking-tight">
              ¡Bienvenido, Moda Express RD!
            </h1>
            <p className="text-xs text-slate-400 mt-1 font-medium">
              Este es el panel de operaciones de tu tienda. Gestiona tus pedidos y envíos.
            </p>
          </div>

          <div className="flex items-center gap-5">
            {/* Date Widget */}
            <div className="hidden md:flex items-center gap-2 border border-[#E7E7EC] px-3.5 py-2.5 rounded-xl bg-slate-50 text-xs font-bold text-slate-600">
              <Calendar size={14} className="text-[#d3121a]" />
              <span>22 de Mayo, 2024</span>
              <ChevronDown size={12} className="text-slate-400" />
            </div>

            {/* Notification Widget */}
            <button className="relative p-2.5 border border-[#E7E7EC] rounded-xl hover:bg-slate-50 transition-colors">
              <Bell size={16} className="text-slate-600" />
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-[#d3121a] rounded-full border-2 border-white"></span>
            </button>

            {/* User Profile */}
            <div className="flex items-center gap-3 text-right border-l border-[#E7E7EC] pl-5">
              <div>
                <div className="font-bold text-xs text-slate-800">Moda Express RD</div>
                <div className="text-[10px] text-slate-400 font-bold tracking-wide uppercase">
                  Tienda Premium
                </div>
              </div>
              <div className="relative w-9 h-9 rounded-full bg-slate-100 border border-[#E7E7EC] overflow-hidden">
                <div className="w-full h-full flex items-center justify-center font-bold text-[#d3121a] text-sm bg-[#fee2e2]">
                  ME
                </div>
              </div>
            </div>

            {/* Quick Action */}
            <Link
              href="/tienda/crear-pedido"
              className="bg-[#d3121a] hover:bg-[#b00f14] text-white font-extrabold text-xs py-3 px-5 rounded-xl shadow-md shadow-red-100 transition-all flex items-center gap-2"
            >
              + Crear Pedido
            </Link>
          </div>
        </header>

        {/* Content Wrapper */}
        <main className="p-8 flex-grow">
          {children}
        </main>

      </div>
    </div>
  );
}
