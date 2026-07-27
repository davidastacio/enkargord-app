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
          <Link href="/" className="flex items-center justify-center">
            <div className="relative h-12 w-[210px] sm:h-14 sm:w-[250px]">
              <Image 
                src="/logo-horizontal.png" 
                alt="EnkargoRD Logo" 
                fill 
                className="object-contain object-center" 
                priority
              />
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
            <a 
              href="https://wa.me/18296564603" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="hover:text-slate-900 transition-colors"
            >
              Contacto
            </a>
          </nav>

          {/* Auth Action Buttons right */}
          <div className="flex items-center gap-3">
            <Link 
              href="/login" 
              className="border border-[#d3121a] text-[#d3121a] hover:bg-[#d3121a]/5 font-bold text-xs py-2.5 px-5 rounded-xl transition-all"
            >
              Iniciar sesión
            </Link>
            <Link 
              href="/registro" 
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
              href="/login" 
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

      {/* Floating WhatsApp Support Button */}
      <a
        href="https://wa.me/18296564603"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 bg-emerald-500 hover:bg-emerald-600 text-white p-3.5 rounded-full shadow-2xl transition-all transform hover:scale-110 flex items-center justify-center gap-2.5 group font-sans border-2 border-white"
        title="Envía un mensaje a Enkargo RD por WhatsApp"
      >
        <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs transition-all duration-300 text-xs font-extrabold pl-1">
          Soporte y Atención
        </span>
        <svg className="w-7 h-7 fill-current" viewBox="0 0 24 24">
          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-0.999 3.648 3.742-0.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
        </svg>
      </a>

    </div>
  );
}
