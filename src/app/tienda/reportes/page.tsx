"use client";

import { useState } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { Download, Calendar, BarChart2 } from 'lucide-react';

export default function StoreReports() {
  const [period, setPeriod] = useState('Mensual');

  // Chart dataset
  const dataSales = [
    { name: 'Semana 1', ventas: 12000, entregas: 8 },
    { name: 'Semana 2', ventas: 19000, entregas: 14 },
    { name: 'Semana 3', ventas: 15400, entregas: 11 },
    { name: 'Semana 4', ventas: 22050, entregas: 15 }
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-slate-950 tracking-tight">Reportes y Estadísticas</h2>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            Consulta el rendimiento comercial, volumen de despachos y tiempos de entrega de tu tienda.
          </p>
        </div>

        <button 
          onClick={() => alert("Comprobante analítico exportado a CSV.")}
          className="bg-white hover:bg-slate-50 border border-[#E7E7EC] text-slate-700 font-bold text-xs py-2.5 px-4 rounded-xl transition-all flex items-center gap-2 shadow-sm"
        >
          <Download size={14} />
          Exportar Reporte
        </button>
      </div>

      {/* Stats row overview */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <div className="bg-white border border-[#E7E7EC] rounded-2xl p-5 shadow-sm space-y-1">
          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Despachos Totales</span>
          <span className="block text-2xl font-extrabold text-slate-950">148 Pedidos</span>
          <span className="text-[10px] text-emerald-600 font-semibold block">94.5% de éxito de entrega</span>
        </div>

        <div className="bg-white border border-[#E7E7EC] rounded-2xl p-5 shadow-sm space-y-1">
          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ingresos por COD</span>
          <span className="block text-2xl font-extrabold text-emerald-600">RD$184,350</span>
          <span className="text-[10px] text-slate-400 font-semibold block">Recaudado y liquidado</span>
        </div>

        <div className="bg-white border border-[#E7E7EC] rounded-2xl p-5 shadow-sm space-y-1">
          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tiempo Promedio Entrega</span>
          <span className="block text-2xl font-extrabold text-slate-950">2.4 Horas</span>
          <span className="text-[10px] text-emerald-600 font-semibold block">Servicio Express Activo</span>
        </div>

      </section>

      {/* Analytics Charts */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Sales charts */}
        <div className="bg-white border border-[#E7E7EC] rounded-2xl p-6 shadow-sm space-y-6">
          <div>
            <h4 className="font-extrabold text-slate-900 text-sm">📈 Ingresos por Ventas (RD$)</h4>
            <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">Volumen semanal acumulado</span>
          </div>

          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dataSales}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#d3121a" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#d3121a" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E7E7EC" />
                <XAxis dataKey="name" fontSize={10} fontStyle="bold" stroke="#64748b" />
                <YAxis fontSize={10} stroke="#64748b" />
                <Tooltip />
                <Area type="monotone" dataKey="ventas" stroke="#d3121a" strokeWidth={2} fillOpacity={1} fill="url(#colorSales)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Orders charts */}
        <div className="bg-white border border-[#E7E7EC] rounded-2xl p-6 shadow-sm space-y-6">
          <div>
            <h4 className="font-extrabold text-slate-900 text-sm">📦 Volumen de Entregas Completadas</h4>
            <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">Cantidad de paquetes entregados</span>
          </div>

          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dataSales}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E7E7EC" />
                <XAxis dataKey="name" fontSize={10} stroke="#64748b" />
                <YAxis fontSize={10} stroke="#64748b" />
                <Tooltip />
                <Bar dataKey="entregas" fill="#d3121a" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </section>

    </div>
  );
}
