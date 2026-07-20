"use client";

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Package,
  Map,
  PhoneOff,
  CheckCircle,
  DollarSign,
  User,
  LogOut,
  Menu,
  X,
  Wifi,
  WifiOff,
  PauseCircle,
  PlayCircle,
  ChevronRight,
} from 'lucide-react';

type MotoristaStatus = 'available' | 'on_route' | 'paused' | 'offline';

const STATUS_CONFIG: Record<MotoristaStatus, { label: string; color: string; bg: string; dot: string; icon: React.ElementType }> = {
  available:  { label: 'Disponible',       color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200',  dot: 'bg-emerald-500', icon: Wifi },
  on_route:   { label: 'En ruta',          color: 'text-blue-700',    bg: 'bg-blue-50 border-blue-200',        dot: 'bg-blue-500 animate-pulse', icon: PlayCircle },
  paused:     { label: 'Pausado',          color: 'text-amber-700',   bg: 'bg-amber-50 border-amber-200',      dot: 'bg-amber-500', icon: PauseCircle },
  offline:    { label: 'Fuera de servicio',color: 'text-slate-500',   bg: 'bg-slate-50 border-slate-200',      dot: 'bg-slate-400', icon: WifiOff },
};

const navItems = [
  { label: 'Inicio',             href: '/motorista',               icon: Home },
  { label: 'Pedidos asignados',  href: '/motorista/pedidos',       icon: Package },
  { label: 'Ruta de entregas',   href: '/motorista/ruta',          icon: Map },
  { label: 'Cliente no contesta',href: '/motorista/no-contactados',icon: PhoneOff },
  { label: 'Pedidos entregados', href: '/motorista/entregados',    icon: CheckCircle },
  { label: 'Liquidación',        href: '/motorista/liquidacion',   icon: DollarSign },
  { label: 'Perfil y vehículo',  href: '/motorista/perfil',        icon: User },
];

import RouteGuard from '@/components/auth/RouteGuard';

export default function MotoristaLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [motorStatus, setMotorStatus] = useState<MotoristaStatus>('available');

  const cfg = STATUS_CONFIG[motorStatus];
  const StatusIcon = cfg.icon;

  const Sidebar = ({ mobile = false }: { mobile?: boolean }) => (
    <aside
      className={`${
        mobile
          ? 'relative w-full h-full'
          : 'hidden lg:flex w-[260px] flex-col fixed top-0 bottom-0 left-0 z-40'
      } bg-white border-r border-[#E7E7EC] flex-col`}
    >
      {/* Logo */}
      <div className="p-4 border-b border-[#E7E7EC] flex items-center justify-between">
        <div className="relative w-[160px] h-14">
          <Image src="/logo.png" alt="EnkargoRD" fill className="object-contain object-left" priority />
        </div>
        {mobile && (
          <button onClick={() => setSidebarOpen(false)} className="p-2 rounded-xl hover:bg-slate-100">
            <X size={20} className="text-slate-500" />
          </button>
        )}
      </div>

      {/* Motorist Info Card */}
      <div className="p-4 border-b border-[#E7E7EC]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#fee2e2] border-2 border-[#d3121a]/20 flex items-center justify-center font-bold text-[#d3121a] text-sm flex-shrink-0">
            CM
          </div>
          <div className="min-w-0">
            <div className="font-bold text-xs text-slate-800 truncate">Carlos Martínez</div>
            <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">Motorista · K-123456</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === '/motorista'
              ? pathname === '/motorista'
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold transition-all group ${
                isActive
                  ? 'bg-[#d3121a] text-white shadow-md shadow-red-100'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Icon size={18} className="flex-shrink-0" />
              <span className="flex-1 truncate">{item.label}</span>
              {!isActive && <ChevronRight size={14} className="opacity-0 group-hover:opacity-40 flex-shrink-0" />}
            </Link>
          );
        })}
      </nav>

      {/* Status Selector + Logout */}
      <div className="p-4 border-t border-[#E7E7EC] space-y-3">
        {/* Status Toggle */}
        <div className={`p-3 rounded-xl border ${cfg.bg} flex items-center gap-2`}>
          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`} />
          <StatusIcon size={14} className={`flex-shrink-0 ${cfg.color}`} />
          <span className={`flex-1 text-xs font-bold ${cfg.color}`}>{cfg.label}</span>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {(Object.entries(STATUS_CONFIG) as [MotoristaStatus, typeof cfg][]).map(([key, s]) => (
            <button
              key={key}
              onClick={() => setMotorStatus(key)}
              className={`py-2 px-2 text-[10px] font-bold rounded-lg border transition-all ${
                motorStatus === key
                  ? `${s.bg} ${s.color} border-current`
                  : 'text-slate-400 border-slate-200 hover:border-slate-300 hover:text-slate-600'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        <Link
          href="/"
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-500 hover:text-red-600 hover:bg-red-50 transition-all"
        >
          <LogOut size={16} />
          Cerrar sesión
        </Link>
      </div>
    </aside>
  );

  return (
    <RouteGuard allowedRoles={['Motorista', 'Admin']}>
      <div className="min-h-screen bg-[#F8F9FB] font-sans text-slate-800 antialiased">
        {/* ── Desktop Sidebar ─────────────────────── */}
        <div className="hidden lg:block">
          <Sidebar />
        </div>

        {/* ── Mobile Sidebar Overlay ───────────────── */}
        {sidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setSidebarOpen(false)}
            />
            <div className="relative w-[280px] h-full bg-white shadow-2xl flex flex-col z-10">
              <Sidebar mobile />
            </div>
          </div>
        )}

        {/* ── Main Content ─────────────────────────── */}
        <div className="lg:pl-[260px] min-h-screen flex flex-col">
          {/* Top header (mobile-first) */}
          <header className="bg-white border-b border-[#E7E7EC] px-4 lg:px-8 py-4 flex items-center justify-between sticky top-0 z-30">
            <div className="flex items-center gap-3">
              {/* Hamburger (mobile only) */}
              <button
                className="lg:hidden p-2 rounded-xl hover:bg-slate-100 transition-colors"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu size={20} className="text-slate-600" />
              </button>
              <div>
                <h1 className="text-base lg:text-xl font-extrabold text-slate-900 tracking-tight">
                  Panel Motorista
                </h1>
                <p className="text-[10px] text-slate-400 font-medium hidden sm:block">
                  EnkargoRD · Sistema de Entregas
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Live status badge */}
              <div className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[11px] font-bold ${cfg.bg} ${cfg.color}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                {cfg.label}
              </div>

              {/* Avatar */}
              <div className="w-9 h-9 rounded-full bg-[#fee2e2] border-2 border-[#d3121a]/20 flex items-center justify-center font-bold text-[#d3121a] text-sm">
                CM
              </div>
            </div>
          </header>

          {/* Page content */}
          <main className="flex-1 p-4 lg:p-8">
            {children}
          </main>

          {/* ── Bottom Nav Bar (mobile) ───────────────── */}
          <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-[#E7E7EC] flex items-stretch">
            {navItems.slice(0, 5).map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === '/motorista'
                  ? pathname === '/motorista'
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors ${
                    isActive ? 'text-[#d3121a]' : 'text-slate-400'
                  }`}
                >
                  <Icon size={20} />
                  <span className="text-[9px] font-bold truncate w-full text-center px-0.5">
                    {item.label.split(' ')[0]}
                  </span>
                </Link>
              );
            })}
          </nav>

          {/* Spacer for mobile bottom nav */}
          <div className="h-16 lg:hidden" />
        </div>
      </div>
    </RouteGuard>
  );
}
