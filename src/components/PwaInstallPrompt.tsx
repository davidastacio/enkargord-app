"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Download, Share, PlusSquare, X, Check, Smartphone } from 'lucide-react';

export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIos, setIsIos] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showIosModal, setShowIosModal] = useState(false);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // 1. Register Service Worker
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => console.log('PWA Service Worker registrado:', reg.scope))
        .catch((err) => console.error('Error registrando Service Worker PWA:', err));
    }

    // 2. Check if already running as standalone PWA
    if (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true
    ) {
      setIsInstalled(true);
      return;
    }

    // 3. Detect iOS device
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIos(isIosDevice);

    // 4. Capture beforeinstallprompt event (Android / Desktop Chrome / Edge)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    const handleCustomTrigger = () => {
      setShowBanner(true);
      if (isIosDevice) {
        setShowIosModal(true);
      }
    };
    window.addEventListener('trigger-pwa-install', handleCustomTrigger);

    // If iOS and not standalone, show prompt banner after 2s
    if (isIosDevice) {
      const timer = setTimeout(() => setShowBanner(true), 2000);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('trigger-pwa-install', handleCustomTrigger);
      };
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('trigger-pwa-install', handleCustomTrigger);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIos) {
      setShowIosModal(true);
    } else if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setShowBanner(false);
      }
      setDeferredPrompt(null);
    } else {
      // Fallback modal if event hasn't fired yet
      setShowIosModal(true);
    }
  };

  if (isInstalled) return null;

  return (
    <>
      {/* Floating / Sticky Banner for PWA Install */}
      {showBanner && (
        <div className="fixed top-3 left-1/2 -translate-x-1/2 z-[99999] w-[92%] max-w-md bg-slate-950 text-white p-3.5 rounded-2xl shadow-2xl border border-slate-800 flex items-center justify-between gap-3 animate-slide-down font-sans">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden relative flex-shrink-0 border border-slate-700 bg-white p-0.5">
              <Image src="/icon-192.png" alt="EnkargoRD Logo" fill className="object-cover rounded-lg" />
            </div>
            <div>
              <h4 className="text-xs font-extrabold text-white flex items-center gap-1.5">
                EnkargoRD App <Smartphone size={13} className="text-emerald-400" />
              </h4>
              <p className="text-[10px] text-slate-400 font-medium">Instala la App en tu pantalla de inicio</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleInstallClick}
              className="bg-[#d3121a] hover:bg-[#b00f14] text-white font-extrabold text-[11px] py-2 px-3.5 rounded-xl transition-all shadow-md shadow-red-900/50 flex items-center gap-1.5"
            >
              <Download size={13} />
              Instalar
            </button>
            <button
              onClick={() => setShowBanner(false)}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* iOS Instructions Modal */}
      {showIosModal && (
        <div className="fixed inset-0 z-[999999] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 font-sans animate-fade-in">
          <div className="bg-white border border-[#E7E7EC] rounded-3xl max-w-sm w-full p-6 shadow-2xl relative space-y-5 text-center">
            
            <button
              onClick={() => setShowIosModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-900 p-1 rounded-lg"
            >
              <X size={18} />
            </button>

            <div className="w-16 h-16 rounded-2xl overflow-hidden relative mx-auto border-2 border-[#d3121a]/20 shadow-md bg-white p-1">
              <Image src="/icon-192.png" alt="EnkargoRD Logo" fill className="object-cover rounded-xl" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-slate-900">
                Instalar EnkargoRD en tu iPhone / Celular
              </h3>
              <p className="text-xs text-slate-400 font-medium">
                Sigue estos sencillos pasos para agregar el ícono oficial a tu pantalla de inicio:
              </p>
            </div>

            <div className="space-y-3 text-left text-xs font-semibold text-slate-700 bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-extrabold text-xs flex-shrink-0">
                  1
                </div>
                <span>Toca el botón <strong className="text-blue-600 inline-flex items-center gap-1">Compartir <Share size={13} /></strong> en el navegador Safari o Chrome.</span>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-extrabold text-xs flex-shrink-0">
                  2
                </div>
                <span>Desliza hacia abajo y selecciona <strong className="text-slate-900 inline-flex items-center gap-1">Agregar a inicio <PlusSquare size={13} /></strong>.</span>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-xl bg-red-50 text-[#d3121a] flex items-center justify-center font-extrabold text-xs flex-shrink-0">
                  3
                </div>
                <span>¡Listo! Toca <strong className="text-[#d3121a]">Agregar</strong> arriba a la derecha y abre EnkargoRD desde tu pantalla de inicio.</span>
              </div>
            </div>

            <button
              onClick={() => setShowIosModal(false)}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs py-3 rounded-xl transition-all"
            >
              Entendido
            </button>

          </div>
        </div>
      )}
    </>
  );
}
