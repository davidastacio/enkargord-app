"use client";

import { useState } from 'react';
import { MapPin, Clock, Truck, ShieldCheck, User } from 'lucide-react';
import MapComponent from '@/components/MapComponent';

export default function StoreTracking() {
  const [activeCourier, setActiveCourier] = useState({
    name: "Carlos M.",
    phone: "+18095551111",
    vehicle: "Motocicleta (Yamaha)",
    plate: "K-123456",
    status: "Activo",
    eta: "15 min",
    zone: "Naco (Santo Domingo)"
  });

  const timelineSteps = [
    { title: "Pedido Recibido", desc: "La tienda Moda Express RD ha registrado el envío.", time: "09:30 AM", done: true },
    { title: "Courier Asignado", desc: "Se asignó a Carlos M. de la flota de reparto.", time: "10:00 AM", done: true },
    { title: "En Ruta de Entrega", desc: "El repartidor va camino a la ubicación de destino.", time: "10:15 AM", done: true },
    { title: "Entregado", desc: "Confirmación de entrega y cobro COD finalizado.", time: "Pendiente", done: false }
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Header */}
      <div>
        <h2 className="text-xl font-extrabold text-slate-950 tracking-tight">Seguimiento en Vivo</h2>
        <p className="text-xs text-slate-400 mt-1 font-medium">
          Rastrea las rutas de tus repartidores y monitorea los tiempos de entrega.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Map column */}
        <div className="lg:col-span-8 bg-white border border-[#E7E7EC] rounded-2xl p-6 shadow-sm flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#d3121a] uppercase tracking-widest block">
              🛵 Ruta de Envíos en curso
            </span>
          </div>

          <div className="w-full h-[400px] rounded-xl overflow-hidden relative">
            <MapComponent activeCouriers={[
              { name: activeCourier.name, status: activeCourier.status, lat: 18.4795, lng: -69.9326, pendingCount: 1 }
            ]} />
          </div>
        </div>

        {/* Courier timeline details */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Card Courier */}
          <div className="bg-white border border-[#E7E7EC] rounded-2xl p-6 shadow-sm space-y-4">
            <h4 className="font-extrabold text-slate-900 text-sm border-b border-slate-100 pb-2">
              🛵 Repartidor Asignado
            </h4>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#fee2e2] text-[#d3121a] flex items-center justify-center font-bold">
                CM
              </div>
              <div>
                <h5 className="font-bold text-xs text-slate-900">{activeCourier.name}</h5>
                <span className="text-[10px] text-slate-400 font-semibold">{activeCourier.vehicle}</span>
              </div>
            </div>

            <div className="text-[11px] font-semibold text-slate-600 space-y-1.5 pt-2 border-t border-slate-100">
              <div className="flex justify-between">
                <span>Placa Vehicular:</span>
                <span className="text-slate-900">{activeCourier.plate}</span>
              </div>
              <div className="flex justify-between">
                <span>Ubicación actual:</span>
                <span className="text-slate-900">{activeCourier.zone}</span>
              </div>
              <div className="flex justify-between text-xs font-extrabold text-[#d3121a] pt-1">
                <span>Tiempo de entrega estimado:</span>
                <span>{activeCourier.eta}</span>
              </div>
            </div>
          </div>

          {/* Timeline steps progress */}
          <div className="bg-white border border-[#E7E7EC] rounded-2xl p-6 shadow-sm space-y-6">
            <h4 className="font-extrabold text-slate-900 text-sm border-b border-slate-100 pb-2">
              📋 Línea de Tiempo del Envíos
            </h4>

            <div className="space-y-6 relative pl-6 before:content-[''] before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100">
              {timelineSteps.map((step) => (
                <div key={step.title} className="relative space-y-1">
                  
                  {/* Timeline bullet check */}
                  <span className={`absolute left-[-21px] top-1.5 w-[12px] h-[12px] rounded-full border-2 ${
                    step.done 
                      ? 'bg-[#d3121a] border-[#d3121a]' 
                      : 'bg-white border-slate-200'
                  }`}></span>

                  <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                    <span>{step.title}</span>
                    <span className="text-[10px] text-slate-400 font-semibold">{step.time}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-semibold leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
