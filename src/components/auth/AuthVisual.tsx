"use client";

import Image from 'next/image';

interface AuthVisualProps {
  badge: string;
  title: string;
  description: string;
}

export default function AuthVisual({ badge, title, description }: AuthVisualProps) {
  return (
    <div className="w-full flex flex-col justify-center max-w-xl space-y-6 select-none relative">
      {/* Background Glow */}
      <div className="absolute w-[80%] h-[80%] bg-[#fee2e2]/60 rounded-full blur-3xl -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></div>
      
      <div className="space-y-4">
        <div className="inline-flex items-center gap-1.5 bg-[#fee2e2] text-[#d3121a] px-3.5 py-1.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider">
          <span>⚡</span> {badge}
        </div>
        
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-slate-900 leading-[1.15] tracking-tight">
          {title}
        </h1>
        
        <p className="text-sm md:text-base text-slate-500 font-medium leading-relaxed">
          {description}
        </p>
      </div>

      <div className="relative w-full aspect-[4/3] max-w-md mx-auto">
        <Image 
          src="/hero-courier.png" 
          alt="Motorista EnkargoRD" 
          fill 
          className="object-contain" 
          priority
        />
      </div>
    </div>
  );
}
