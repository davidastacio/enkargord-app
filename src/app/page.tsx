"use client";

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Package, 
  MapPin, 
  Clock, 
  ShieldCheck, 
  PhoneCall,
  ChevronRight,
  Check,
  Truck,
  Building2,
  Sparkles,
  Globe,
  DollarSign,
  CheckCircle2,
  ArrowRight,
  HelpCircle,
  TrendingUp,
  Smartphone,
  Menu,
  X,
  Play,
} from 'lucide-react';

export default function LandingPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F8F9FB] font-sans text-slate-800 antialiased flex flex-col justify-between scroll-smooth">
      
      {/* ==========================================
         HEADER / NAVBAR
         ========================================== */}
      <header className="bg-white/95 backdrop-blur-md border-b border-[#E7E7EC] px-6 py-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          {/* Logo on the left */}
          <Link href="/" className="flex items-center justify-center">
            <div className="relative h-11 w-[190px] sm:h-14 sm:w-[250px]">
              <Image 
                src="/logo-horizontal.png" 
                alt="EnkargoRD Logo" 
                fill 
                className="object-contain object-center" 
                priority
              />
            </div>
          </Link>

          {/* Navigation links center (Desktop) */}
          <nav className="hidden lg:flex items-center gap-5 xl:gap-8 text-sm font-semibold text-slate-600 whitespace-nowrap flex-shrink-0">
            <Link href="#" className="text-[#d3121a] hover:text-[#b00f14] transition-colors relative after:content-[''] after:absolute after:bottom-[-20px] after:left-0 after:right-0 after:h-[2px] after:bg-[#d3121a]">
              Inicio
            </Link>
            <a href="#como-funciona" className="hover:text-slate-900 transition-colors">
              Cómo funciona
            </a>
            <a href="#servicios" className="hover:text-slate-900 transition-colors">
              Servicios
            </a>
            <a href="#precios" className="hover:text-slate-900 transition-colors">
              Precios
            </a>
            <a href="#nosotros" className="hover:text-slate-900 transition-colors">
              Nosotros
            </a>
            <a 
              href="https://wa.me/18296564603" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="hover:text-slate-900 transition-colors"
            >
              Contacto
            </a>
          </nav>

          {/* Auth Action Buttons right (Desktop) */}
          <div className="hidden lg:flex items-center gap-2 xl:gap-3 flex-shrink-0">
            <button
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new CustomEvent('trigger-pwa-install'));
                }
              }}
              className="hidden xl:flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs py-2.5 px-3.5 rounded-xl transition-all shadow-sm whitespace-nowrap flex-shrink-0"
              title="Instalar EnkargoRD App en tu celular"
            >
              <Smartphone size={14} className="text-emerald-400" />
              <span>Instalar App</span>
            </button>
            <Link 
              href="/login" 
              className="border border-[#d3121a] text-[#d3121a] hover:bg-[#d3121a]/5 font-bold text-xs py-2.5 px-4 rounded-xl transition-all whitespace-nowrap flex-shrink-0"
            >
              Iniciar sesión
            </Link>
            <Link 
              href="/registro" 
              className="bg-[#d3121a] hover:bg-[#b00f14] text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-md shadow-red-100 transition-all whitespace-nowrap flex-shrink-0"
            >
              Regístrate
            </Link>
          </div>

          {/* Mobile/Tablet Hamburger Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 text-slate-800 hover:bg-slate-100 rounded-xl transition-colors flex-shrink-0"
            aria-label="Abrir menú"
          >
            {isMobileMenuOpen ? <X size={26} /> : <Menu size={26} />}
          </button>

        </div>

        {/* Mobile/Tablet Dropdown Menu Drawer */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-[#E7E7EC] mt-4 pt-4 pb-6 space-y-4 animate-slide-down">
            <nav className="flex flex-col space-y-3 font-bold text-sm text-slate-700 px-2">
              <Link 
                href="#" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="py-2 text-[#d3121a]"
              >
                Inicio
              </Link>
              <a 
                href="#como-funciona" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="py-2 hover:text-slate-900"
              >
                Cómo funciona
              </a>
              <a 
                href="#servicios" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="py-2 hover:text-slate-900"
              >
                Servicios
              </a>
              <a 
                href="#precios" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="py-2 hover:text-slate-900"
              >
                Precios
              </a>
              <a 
                href="#nosotros" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="py-2 hover:text-slate-900"
              >
                Nosotros
              </a>
              <a 
                href="https://wa.me/18296564603" 
                target="_blank" 
                rel="noopener noreferrer" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="py-2 hover:text-slate-900"
              >
                Contacto
              </a>
            </nav>

            <div className="pt-2 border-t border-slate-100 flex flex-col gap-2.5">
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  if (typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('trigger-pwa-install'));
                  }
                }}
                className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white font-extrabold text-xs py-3 rounded-xl shadow-sm"
              >
                <Smartphone size={16} className="text-emerald-400" />
                <span>Instalar App Web</span>
              </button>
              
              <div className="grid grid-cols-2 gap-2">
                <Link 
                  href="/login" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full border border-[#d3121a] text-[#d3121a] font-bold text-xs py-3 rounded-xl text-center"
                >
                  Iniciar sesión
                </Link>
                <Link 
                  href="/registro" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full bg-[#d3121a] text-white font-bold text-xs py-3 rounded-xl text-center shadow-md shadow-red-100"
                >
                  Regístrate
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* ==========================================
         HERO SECTION
         ========================================== */}
      <section className="px-6 py-8 md:py-20 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-12 items-center">
        
        {/* Left Column Text */}
        <div className="space-y-6 lg:max-w-xl">
          <div className="inline-flex items-center gap-2 bg-[#fee2e2] text-[#d3121a] px-3.5 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wider">
            <span>⚡</span> Rápido. Seguro. Confiable.
          </div>
          
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-slate-900 leading-[1.15] tracking-tight">
            Llevamos lo que importa, <span className="text-[#d3121a]">a donde importa.</span>
          </h2>
          
          <p className="text-sm sm:text-base md:text-lg text-slate-500 font-medium leading-relaxed">
            EnkargoRD es la plataforma de envíos que conecta personas y negocios con entregas rápidas, seguras y en tiempo real en todo el país.
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-2">
            <Link 
              href="/login" 
              className="w-full sm:w-auto bg-[#d3121a] hover:bg-[#b00f14] text-white font-extrabold text-sm py-4 px-8 rounded-2xl shadow-lg shadow-red-200 transition-all flex items-center justify-center gap-2 text-center"
            >
              <Package size={18} />
              <span>Crear envío</span>
            </Link>
            <a 
              href="#como-funciona" 
              className="w-full sm:w-auto bg-white hover:bg-slate-50 border border-[#E7E7EC] text-slate-800 font-extrabold text-sm py-4 px-8 rounded-2xl transition-all shadow-sm flex items-center justify-center gap-2 text-center"
            >
              <Play size={15} className="fill-slate-800 text-slate-800" />
              <span>Ver cómo funciona</span>
            </a>
          </div>
        </div>

        {/* Right Column Image Composition */}
        <div className="relative w-full aspect-[4/3] max-w-lg lg:max-w-none mx-auto flex items-center justify-center">
          <div className="absolute w-[85%] h-[85%] bg-[#fee2e2]/60 rounded-full blur-3xl -z-10"></div>
          
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
              <div className="w-14 h-14 bg-[#fee2e2] text-[#d3121a] rounded-2xl flex items-center justify-center font-bold text-xl shadow-sm relative">
                1
              </div>
              <h4 className="font-extrabold text-slate-800 text-base">Crea tu envío</h4>
              <p className="text-sm text-slate-400 font-medium max-w-xs leading-relaxed">
                Ingresa los detalles de recogida y destino desde tu panel.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-6 space-y-4 flex flex-col items-center">
              <div className="w-14 h-14 bg-[#fee2e2] text-[#d3121a] rounded-2xl flex items-center justify-center font-bold text-xl shadow-sm relative">
                2
              </div>
              <h4 className="font-extrabold text-slate-800 text-base">Asignamos tu courier</h4>
              <p className="text-sm text-slate-400 font-medium max-w-xs leading-relaxed">
                Encontramos al mejor courier o ruta cercana a ti.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-6 space-y-4 flex flex-col items-center">
              <div className="w-14 h-14 bg-[#fee2e2] text-[#d3121a] rounded-2xl flex items-center justify-center font-bold text-xl shadow-sm relative">
                3
              </div>
              <h4 className="font-extrabold text-slate-800 text-base">Entregamos</h4>
              <p className="text-sm text-slate-400 font-medium max-w-xs leading-relaxed">
                Tu pedido llega rápido, seguro y con confirmación instantánea.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* ==========================================
         SECCIÓN DE BENEFICIOS (CARD GRID RECURSO MOBILES)
         ========================================== */}
      <section className="px-6 py-10 max-w-7xl mx-auto w-full">
        <div className="bg-white border border-[#E7E7EC] rounded-3xl p-6 md:p-8 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          
          {/* Benefit 1 */}
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full border-2 border-red-500 text-red-500 flex items-center justify-center flex-shrink-0">
              <ShieldCheck size={24} />
            </div>
            <div className="space-y-1">
              <h5 className="font-extrabold text-sm text-slate-900">Seguridad garantizada</h5>
              <p className="text-xs text-slate-400 font-medium leading-relaxed">
                Tus envíos están protegidos en cada paso del camino.
              </p>
            </div>
          </div>

          {/* Benefit 2 */}
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full border-2 border-red-500 text-red-500 flex items-center justify-center flex-shrink-0">
              <Clock size={24} />
            </div>
            <div className="space-y-1">
              <h5 className="font-extrabold text-sm text-slate-900">Entregas rápidas</h5>
              <p className="text-xs text-slate-400 font-medium leading-relaxed">
                Entregas el mismo día en tiempo récord.
              </p>
            </div>
          </div>

          {/* Benefit 3 */}
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full border-2 border-red-500 text-red-500 flex items-center justify-center flex-shrink-0">
              <MapPin size={24} />
            </div>
            <div className="space-y-1">
              <h5 className="font-extrabold text-sm text-slate-900">Seguimiento en tiempo real</h5>
              <p className="text-xs text-slate-400 font-medium leading-relaxed">
                Rastrea tu pedido en vivo desde nuestra plataforma.
              </p>
            </div>
          </div>

          {/* Benefit 4 */}
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full border-2 border-red-500 text-red-500 flex items-center justify-center flex-shrink-0">
              <PhoneCall size={24} />
            </div>
            <div className="space-y-1">
              <h5 className="font-extrabold text-sm text-slate-900">Soporte 24/7</h5>
              <p className="text-xs text-slate-400 font-medium leading-relaxed">
                Estamos disponibles para ayudarte siempre.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* ==========================================
         SECCIÓN DE SERVICIOS (#servicios)
         ========================================== */}
      <section id="servicios" className="py-16 md:py-20 px-6 bg-[#F8F9FB]">
        <div className="max-w-7xl mx-auto space-y-12">
          
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-xs font-bold text-[#d3121a] uppercase tracking-widest block">
              NUESTROS SERVICIOS
            </span>
            <h3 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
              Soluciones logísticas diseñadas para hacer crecer tu negocio
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed">
              Desde envíos locales en la ciudad hasta entregas interprovinciales a cualquier rincón de República Dominicana.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Service 1 */}
            <div className="bg-white border border-[#E7E7EC] rounded-2xl p-6 shadow-sm hover:shadow-md transition-all space-y-4 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="w-12 h-12 bg-red-50 text-[#d3121a] rounded-xl flex items-center justify-center font-bold">
                  <Truck size={24} />
                </div>
                <h4 className="font-extrabold text-slate-900 text-base">Envíos Locales Express</h4>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">
                  Entregas el mismo día dentro del Gran Santo Domingo con rastreo en vivo y mensajeros capacitados.
                </p>
              </div>
              <ul className="text-xs text-slate-600 space-y-2 border-t border-slate-100 pt-4 font-semibold">
                <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-500" /> Entrega misma jornada</li>
                <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-500" /> Rastreo GPS en tiempo real</li>
              </ul>
            </div>

            {/* Service 2 */}
            <div className="bg-white border border-[#E7E7EC] rounded-2xl p-6 shadow-sm hover:shadow-md transition-all space-y-4 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-bold">
                  <Globe size={24} />
                </div>
                <h4 className="font-extrabold text-slate-900 text-base">Envíos Nacionales Globales</h4>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">
                  Conexión logística directa a las 31 provincias del país con despacho organizado por corredores.
                </p>
              </div>
              <ul className="text-xs text-slate-600 space-y-2 border-t border-slate-100 pt-4 font-semibold">
                <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-500" /> Cobertura nacional 100%</li>
                <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-500" /> Salidas diarias programadas</li>
              </ul>
            </div>

            {/* Service 3 */}
            <div className="bg-white border border-[#E7E7EC] rounded-2xl p-6 shadow-sm hover:shadow-md transition-all space-y-4 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center font-bold">
                  <Package size={24} />
                </div>
                <h4 className="font-extrabold text-slate-900 text-base">Fulfillment y Almacén</h4>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">
                  Guardamos tu inventario, empacamos tus órdenes y nos encargamos de despachar sin que muevas un dedo.
                </p>
              </div>
              <ul className="text-xs text-slate-600 space-y-2 border-t border-slate-100 pt-4 font-semibold">
                <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-500" /> Empaque personalizado</li>
                <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-500" /> Control de inventario</li>
              </ul>
            </div>

            {/* Service 4 */}
            <div className="bg-white border border-[#E7E7EC] rounded-2xl p-6 shadow-sm hover:shadow-md transition-all space-y-4 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center font-bold">
                  <DollarSign size={24} />
                </div>
                <h4 className="font-extrabold text-slate-900 text-base">Cobro Contra Entrega (COD)</h4>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">
                  Recaudamos el dinero en efectivo de tus ventas en la puerta del cliente y lo depositamos directamente.
                </p>
              </div>
              <ul className="text-xs text-slate-600 space-y-2 border-t border-slate-100 pt-4 font-semibold">
                <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-500" /> Liquidaciones transparentes</li>
                <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-500" /> Reportes de cobro diarios</li>
              </ul>
            </div>

          </div>

        </div>
      </section>

      {/* ==========================================
         SECCIÓN DE PRECIOS (#precios)
         ========================================== */}
      <section id="precios" className="py-16 md:py-20 px-6 bg-white border-t border-b border-[#E7E7EC]">
        <div className="max-w-7xl mx-auto space-y-12">
          
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-xs font-bold text-[#d3121a] uppercase tracking-widest block">
              TARIFAS TRANSPARENTES
            </span>
            <h3 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
              Precios fijos sin sorpresas ni letras pequeñas
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed">
              Disfruta de tarifas sencillas adaptadas a la ubicación de tu cliente.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            
            {/* Plan 1: Santo Domingo */}
            <div className="bg-[#F8F9FB] border border-[#E7E7EC] rounded-3xl p-6 sm:p-8 space-y-6 flex flex-col justify-between hover:border-slate-300 transition-all relative">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="bg-red-50 text-[#d3121a] px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                    Envío Local
                  </span>
                  <MapPin size={22} className="text-[#d3121a]" />
                </div>
                
                <div>
                  <h4 className="text-2xl font-extrabold text-slate-900">Santo Domingo</h4>
                  <p className="text-xs text-slate-500 font-medium mt-1">Gran Santo Domingo, DN y sectores aledaños</p>
                </div>

                <div className="py-4 border-y border-slate-200">
                  <span className="text-4xl font-black text-slate-900">RD$ 300</span>
                  <span className="text-xs text-slate-500 font-bold ml-2">/ por envío</span>
                </div>

                <ul className="space-y-3 text-xs font-semibold text-slate-700">
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0" />
                    <span>Entrega el mismo día</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0" />
                    <span>Seguimiento GPS en tiempo real</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0" />
                    <span>Cobro Contra Entrega (COD) incluido</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0" />
                    <span>Prueba de entrega con foto/firma</span>
                  </li>
                </ul>
              </div>

              <Link 
                href="/registro" 
                className="w-full bg-[#d3121a] hover:bg-[#b00f14] text-white font-extrabold text-xs py-4 px-6 rounded-xl transition-all shadow-md shadow-red-100 text-center block"
              >
                Empezar Envíos en Santo Domingo
              </Link>
            </div>

            {/* Plan 2: Envío Global / Nacional */}
            <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 space-y-6 flex flex-col justify-between shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-[#d3121a] text-white px-4 py-1 rounded-bl-xl text-[10px] font-extrabold uppercase tracking-widest">
                Recomendado
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="bg-white/10 text-amber-300 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                    Envío Global / Nacional
                  </span>
                  <Globe size={22} className="text-amber-300" />
                </div>
                
                <div>
                  <h4 className="text-2xl font-extrabold text-white">Todo el País</h4>
                  <p className="text-xs text-slate-300 font-medium mt-1">31 Provincias y todos los municipios de RD</p>
                </div>

                <div className="py-4 border-y border-slate-800">
                  <span className="text-4xl font-black text-white">RD$ 400</span>
                  <span className="text-xs text-slate-400 font-bold ml-2">/ por envío</span>
                </div>

                <ul className="space-y-3 text-xs font-semibold text-slate-200">
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0" />
                    <span>Cobertura nacional en 31 provincias</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0" />
                    <span>Rutas interprovinciales diarias</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0" />
                    <span>Seguro de paquete garantizado</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0" />
                    <span>Impresión de Labels e historial completo</span>
                  </li>
                </ul>
              </div>

              <a 
                href="https://wa.me/18296564603"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-white text-slate-900 hover:bg-slate-100 font-extrabold text-xs py-4 px-6 rounded-xl transition-all text-center block"
              >
                Solicitar Servicio Nacional
              </a>
            </div>

          </div>

        </div>
      </section>

      {/* ==========================================
         SECCIÓN NOSOTROS (#nosotros)
         ========================================== */}
      <section id="nosotros" className="py-16 md:py-20 px-6 bg-[#F8F9FB]">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          <div className="space-y-6">
            <span className="text-xs font-bold text-[#d3121a] uppercase tracking-widest block">
              SOBRE NOSOTROS
            </span>
            <h3 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
              La plataforma de logística moderna hecha para República Dominicana
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed">
              En EnkargoRD combinamos tecnología avanzada, seguimiento satelital en vivo y una red de repartidores capacitados para que comercios y particulares realicen entregas sin complicaciones.
            </p>
            
            <div className="grid grid-cols-2 gap-4 sm:gap-6 pt-2">
              <div className="bg-white border border-[#E7E7EC] p-4 rounded-2xl">
                <span className="block text-2xl sm:text-3xl font-black text-[#d3121a]">15k+</span>
                <span className="text-xs font-bold text-slate-600 mt-1 block">Envíos completados</span>
              </div>
              <div className="bg-white border border-[#E7E7EC] p-4 rounded-2xl">
                <span className="block text-2xl sm:text-3xl font-black text-slate-900">31</span>
                <span className="text-xs font-bold text-slate-600 mt-1 block">Provincias conectadas</span>
              </div>
              <div className="bg-white border border-[#E7E7EC] p-4 rounded-2xl">
                <span className="block text-2xl sm:text-3xl font-black text-slate-900">99.4%</span>
                <span className="text-xs font-bold text-slate-600 mt-1 block">Efectividad de entrega</span>
              </div>
              <div className="bg-white border border-[#E7E7EC] p-4 rounded-2xl">
                <span className="block text-2xl sm:text-3xl font-black text-[#d3121a]">24/7</span>
                <span className="text-xs font-bold text-slate-600 mt-1 block">Atención al cliente</span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-[#E7E7EC] rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
            <h4 className="text-lg sm:text-xl font-extrabold text-slate-900">¿Por qué los comercios nos eligen?</h4>
            <div className="space-y-4 text-xs font-semibold text-slate-600">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-red-50 text-[#d3121a] rounded-lg mt-0.5">
                  <Sparkles size={16} />
                </div>
                <div>
                  <strong className="text-slate-900 block text-sm">Plataforma Todo en Uno</strong>
                  <span>Gestiona tiendas, motoristas, etiquetas PDF y liquidaciones desde un solo panel intuitivo.</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg mt-0.5">
                  <TrendingUp size={16} />
                </div>
                <div>
                  <strong className="text-slate-900 block text-sm">Cobro Seguro y Transparente</strong>
                  <span>Transfieres el costo de tu producto directamente a tu cuenta con cierres de caja claros.</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg mt-0.5">
                  <ShieldCheck size={16} />
                </div>
                <div>
                  <strong className="text-slate-900 block text-sm">Soporte Humano Directo</strong>
                  <span>Atención rápida vía WhatsApp para resolver cualquier consulta en tiempo real.</span>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <a
                href="https://wa.me/18296564603"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs py-3.5 px-6 rounded-xl transition-all text-center flex items-center justify-center gap-2"
              >
                Hablar con un asesor comercial
                <ArrowRight size={14} />
              </a>
            </div>
          </div>

        </div>
      </section>

      {/* ==========================================
         FOOTER
         ========================================== */}
      <footer className="bg-slate-950 text-slate-400 py-12 px-6 border-t border-slate-800 text-xs">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="space-y-3">
            <div className="relative h-10 w-[180px]">
              <Image 
                src="/logo-horizontal.png" 
                alt="EnkargoRD Logo" 
                fill 
                className="object-contain object-left invert" 
              />
            </div>
            <p className="text-[11px] leading-relaxed text-slate-500 font-medium">
              Plataforma logística centralizada de envíos express y cobertura nacional en República Dominicana.
            </p>
          </div>

          <div>
            <h6 className="font-extrabold text-white text-xs uppercase tracking-wider mb-3">Navegación</h6>
            <ul className="space-y-2 font-semibold">
              <li><a href="#" className="hover:text-white transition-colors">Inicio</a></li>
              <li><a href="#como-funciona" className="hover:text-white transition-colors">Cómo funciona</a></li>
              <li><a href="#servicios" className="hover:text-white transition-colors">Servicios</a></li>
              <li><a href="#precios" className="hover:text-white transition-colors">Precios</a></li>
              <li><a href="#nosotros" className="hover:text-white transition-colors">Nosotros</a></li>
            </ul>
          </div>

          <div>
            <h6 className="font-extrabold text-white text-xs uppercase tracking-wider mb-3">Tarifas</h6>
            <ul className="space-y-2 font-semibold text-slate-400">
              <li>Santo Domingo: <strong className="text-white">RD$ 300</strong></li>
              <li>Envío Global / Nacional: <strong className="text-white">RD$ 400</strong></li>
              <li>Fulfillment personalizado</li>
            </ul>
          </div>

          <div>
            <h6 className="font-extrabold text-white text-xs uppercase tracking-wider mb-3">Contacto</h6>
            <p className="font-semibold text-slate-300 mb-2">Atención al Cliente:</p>
            <a href="https://wa.me/18296564603" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline font-extrabold block">
              WhatsApp: +1 (829) 656-4603
            </a>
          </div>
        </div>

        <div className="max-w-7xl mx-auto border-t border-slate-900 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 font-semibold text-[11px] text-slate-600">
          <span>&copy; {new Date().getFullYear()} EnkargoRD. Todos los derechos reservados.</span>
          <span>República Dominicana</span>
        </div>
      </footer>

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
