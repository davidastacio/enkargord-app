"use client";

import Image from 'next/image';
import Link from 'next/link';
import { 
  Package, 
  MapPin, 
  Clock, 
  ShieldCheck, 
  PhoneCall,
  ChevronRight,
  Menu,
  Check
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#F8F9FB] font-sans text-slate-800 antialiased flex flex-col justify-between">
      
      {/* ==========================================
         HEADER / NAVBAR
         ========================================== */}
      <header className="bg-white border-b border-[#E7E7EC] px-6 py-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          {/* Logo on the left */}
          <Link href="/" className="flex items-center gap-3">
            <div className="relative w-10 h-10">
              <Image 
                src="/logo.png" 
                alt="EnkargoRD Logo" 
                fill 
                className="object-contain" 
                priority
              />
            </div>
            <div className="hidden sm:block">
              <span className="font-display font-extrabold text-xl text-slate-900 tracking-tight block">
                Enkargo<span className="text-[#d3121a]">RD</span>
              </span>
              <span className="block text-[9px] text-[#d3121a] font-bold tracking-widest uppercase mt-[-3px]">
                LLEVAMOS LO QUE IMPORTA
              </span>
            </div>
          </Link>

          {/* Navigation links center */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
            <Link href="#" className="text-[#d3121a] hover:text-[#b00f14] transition-colors relative after:content-[''] after:absolute after:bottom-[-20px] after:left-0 after:right-0 after:h-[2px] after:bg-[#d3121a]">
              Inicio
            </Link>
            <Link href="#como-funciona" className="hover:text-slate-900 transition-colors">
              Cómo funciona
            </Link>
            <Link href="#servicios" className="hover:text-slate-900 transition-colors">
              Servicios
            </Link>
            <Link href="#precios" className="hover:text-slate-900 transition-colors">
              Precios
            </Link>
            <Link href="#nosotros" className="hover:text-slate-900 transition-colors">
              Nosotros
            </Link>
            <Link href="#contacto" className="hover:text-slate-900 transition-colors">
              Contacto
            </Link>
          </nav>

          {/* Auth Action Buttons right */}
          <div className="flex items-center gap-3">
            <Link 
              href="/admin" 
              className="border border-[#d3121a] text-[#d3121a] hover:bg-[#d3121a]/5 font-bold text-xs py-2.5 px-5 rounded-xl transition-all"
            >
              Iniciar sesión
            </Link>
            <Link 
              href="/admin" 
              className="bg-[#d3121a] hover:bg-[#b00f14] text-white font-bold text-xs py-2.5 px-5 rounded-xl shadow-md shadow-red-100 transition-all"
            >
              Regístrate
            </Link>
          </div>

        </div>
      </header>

      {/* ==========================================
         HERO SECTION
         ========================================== */}
      <section className="px-6 py-12 md:py-20 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        
        {/* Left Column Text */}
        <div className="space-y-6 lg:max-w-xl">
          <div className="inline-flex items-center gap-2 bg-[#fee2e2] text-[#d3121a] px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">
            <span>⚡</span> Rápido. Seguro. Confiable.
          </div>
          
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-slate-900 leading-[1.1] tracking-tight">
            Llevamos lo que importa, <span className="text-[#d3121a]">a donde importa.</span>
          </h2>
          
          <p className="text-base md:text-lg text-slate-500 font-medium leading-relaxed">
            EnkargoRD es la plataforma de envíos que conecta personas y negocios con entregas rápidas, seguras y en tiempo real.
          </p>

          <div className="flex flex-wrap gap-4 pt-2">
            <Link 
              href="/admin" 
              className="bg-[#d3121a] hover:bg-[#b00f14] text-white font-bold text-sm py-4 px-8 rounded-xl shadow-lg shadow-red-200 transition-all flex items-center gap-2"
            >
              Crear envío
              <ChevronRight size={16} />
            </Link>
            <a 
              href="#como-funciona" 
              className="bg-white hover:bg-slate-50 border border-[#E7E7EC] text-slate-700 font-bold text-sm py-4 px-8 rounded-xl transition-all"
            >
              Ver cómo funciona
            </a>
          </div>
        </div>

        {/* Right Column Image Composition */}
        <div className="relative w-full aspect-[4/3] max-w-lg lg:max-w-none mx-auto flex items-center justify-center">
          {/* Subtle abstract background element for movement effect */}
          <div className="absolute w-[80%] h-[80%] bg-[#fee2e2]/60 rounded-full blur-3xl -z-10"></div>
          
          <div className="relative w-full h-full">
            <Image 
              src="/hero-courier.png" 
              alt="Motorista EnkargoRD" 
              fill 
              className="object-contain" 
              priority
            />
          </div>
        </div>

      </section>

      {/* ==========================================
         SECCIÓN “CÓMO FUNCIONA”
         ========================================== */}
      <section id="como-funciona" className="bg-white border-t border-b border-[#E7E7EC] py-16 px-6">
        <div className="max-w-7xl mx-auto text-center space-y-12">
          
          <div className="space-y-2">
            <span className="text-xs font-bold text-[#d3121a] uppercase tracking-widest block">
              CÓMO FUNCIONA
            </span>
            <h3 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
              Envíos simples en 3 pasos
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Step 1 */}
            <div className="p-6 space-y-4 flex flex-col items-center">
              <div className="w-14 h-14 bg-[#fee2e2] text-[#d3121a] rounded-2xl flex items-center justify-center font-bold text-xl shadow-sm">
                1
              </div>
              <h4 className="font-extrabold text-slate-800 text-base">Crea tu envío</h4>
              <p className="text-sm text-slate-400 font-medium max-w-xs leading-relaxed">
                Ingresa los detalles de recogida y destino.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-6 space-y-4 flex flex-col items-center">
              <div className="w-14 h-14 bg-[#fee2e2] text-[#d3121a] rounded-2xl flex items-center justify-center font-bold text-xl shadow-sm">
                2
              </div>
              <h4 className="font-extrabold text-slate-800 text-base">Asignamos tu courier</h4>
              <p className="text-sm text-slate-400 font-medium max-w-xs leading-relaxed">
                Encontramos al mejor courier cercano a ti.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-6 space-y-4 flex flex-col items-center">
              <div className="w-14 h-14 bg-[#fee2e2] text-[#d3121a] rounded-2xl flex items-center justify-center font-bold text-xl shadow-sm">
                3
              </div>
              <h4 className="font-extrabold text-slate-800 text-base">Entregamos</h4>
              <p className="text-sm text-slate-400 font-medium max-w-xs leading-relaxed">
                Tu pedido llega rápido, seguro y a tiempo.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* ==========================================
         SECCIÓN DE BENEFICIOS (FRANJA ROJA)
         ========================================== */}
      <section className="bg-[#d3121a] text-white py-8 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Benefit 1 */}
          <div className="flex items-start gap-4">
            <div className="p-2.5 bg-white/10 rounded-xl mt-1 text-white">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h5 className="font-bold text-sm">Seguridad garantizada</h5>
              <p className="text-[11px] text-white/80 mt-1 font-medium leading-relaxed">
                Tus envíos están protegidos cada paso del camino.
              </p>
            </div>
          </div>

          {/* Benefit 2 */}
          <div className="flex items-start gap-4">
            <div className="p-2.5 bg-white/10 rounded-xl mt-1 text-white">
              <Clock size={20} />
            </div>
            <div>
              <h5 className="font-bold text-sm">Entregas rápidas</h5>
              <p className="text-[11px] text-white/80 mt-1 font-medium leading-relaxed">
                Entregas el mismo día en tiempo récord.
              </p>
            </div>
          </div>

          {/* Benefit 3 */}
          <div className="flex items-start gap-4">
            <div className="p-2.5 bg-white/10 rounded-xl mt-1 text-white">
              <MapPin size={20} />
            </div>
            <div>
              <h5 className="font-bold text-sm">Seguimiento en tiempo real</h5>
              <p className="text-[11px] text-white/80 mt-1 font-medium leading-relaxed">
                Rastrea tu pedido en vivo desde nuestra plataforma.
              </p>
            </div>
          </div>

          {/* Benefit 4 */}
          <div className="flex items-start gap-4">
            <div className="p-2.5 bg-white/10 rounded-xl mt-1 text-white">
              <PhoneCall size={20} />
            </div>
            <div>
              <h5 className="font-bold text-sm">Soporte 24/7</h5>
              <p className="text-[11px] text-white/80 mt-1 font-medium leading-relaxed">
                Estamos disponibles para ayudarte siempre.
              </p>
            </div>
          </div>

        </div>
      </section>

    </div>
  );
}
