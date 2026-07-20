"use client";

import Image from 'next/image';
import Link from 'next/link';
import { HelpCircle } from 'lucide-react';

export default function AuthHeader() {
  return (
    <header className="w-full bg-white/80 backdrop-blur-sm border-b border-[#E7E7EC] px-6 py-4 fixed top-0 left-0 right-0 z-50 flex items-center justify-between">
      <Link href="/" className="flex items-center justify-center">
        <div className="relative w-72 h-24">
          <Image 
            src="/logo.png" 
            alt="EnkargoRD Logo" 
            fill 
            className="object-contain object-center" 
            priority
          />
        </div>
      </Link>

      <div className="flex items-center gap-4 text-xs font-semibold text-slate-500">
        <div className="hidden sm:flex items-center gap-1.5 hover:text-slate-900 transition-colors cursor-pointer">
          <HelpCircle size={16} />
          <span>¿Necesitas ayuda?</span>
        </div>
        <Link 
          href="/" 
          className="bg-white border border-[#E7E7EC] hover:bg-slate-50 text-slate-700 font-bold px-4 py-2 rounded-xl transition-all shadow-sm"
        >
          Ir al inicio
        </Link>
      </div>
    </header>
  );
}
