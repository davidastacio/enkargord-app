"use client";

import { useState } from 'react';
import { CreditCard, DollarSign, ArrowUpRight, ArrowDownRight, Download } from 'lucide-react';

interface PaymentRow {
  date: string;
  reference: string;
  type: 'Liquidación' | 'Costo de Envío';
  amount: number;
  status: 'Completado' | 'Pendiente';
}

export default function StorePayments() {
  const [payments] = useState<PaymentRow[]>([
    { date: "2026-07-20", reference: "LIQ-9800", type: "Liquidación", amount: 15400, status: "Completado" },
    { date: "2026-07-19", reference: "ENV-2001", type: "Costo de Envío", amount: 200, status: "Completado" },
    { date: "2026-07-18", reference: "LIQ-9799", type: "Liquidación", amount: 22400, status: "Completado" },
    { date: "2026-07-17", reference: "ENV-2000", type: "Costo de Envío", amount: 450, status: "Completado" },
    { date: "2026-07-15", reference: "LIQ-9798", type: "Liquidación", amount: 8900, status: "Completado" }
  ]);

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Header */}
      <div>
        <h2 className="text-xl font-extrabold text-slate-950 tracking-tight">Pagos y Cobros</h2>
        <p className="text-xs text-slate-400 mt-1 font-medium">
          Controla los balances recaudados por COD en las calles y monitorea tus estados de liquidación semanal.
        </p>
      </div>

      {/* Finance Overview */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Card 1 */}
        <div className="bg-white border border-[#E7E7EC] rounded-2xl p-5 shadow-sm space-y-1 flex flex-col justify-between">
          <div>
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Por liquidar a tienda</span>
            <span className="block text-2xl font-extrabold text-emerald-600">RD$12,500</span>
          </div>
          <p className="text-[10px] text-slate-400 font-semibold mt-4">Fecha de próximo pago: 24 de Julio, 2026</p>
        </div>

        {/* Card 2 */}
        <div className="bg-white border border-[#E7E7EC] rounded-2xl p-5 shadow-sm space-y-1 flex flex-col justify-between">
          <div>
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cargos por Envíos</span>
            <span className="block text-2xl font-extrabold text-[#d3121a]">RD$1,850</span>
          </div>
          <p className="text-[10px] text-slate-400 font-semibold mt-4">Comisión deducida automáticamente</p>
        </div>

        {/* Card 3 */}
        <div className="bg-white border border-[#E7E7EC] rounded-2xl p-5 shadow-sm space-y-1 flex flex-col justify-between">
          <div>
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Recaudado COD</span>
            <span className="block text-2xl font-extrabold text-slate-950">RD$184,350</span>
          </div>
          <p className="text-[10px] text-slate-400 font-semibold mt-4">Acumulado total de cobros históricos</p>
        </div>

      </section>

      {/* Movements Table */}
      <section className="bg-white border border-[#E7E7EC] rounded-2xl overflow-hidden shadow-sm">
        <div className="p-6 border-b border-[#E7E7EC]">
          <h3 className="font-extrabold text-slate-900 text-sm">📋 Historial de Transacciones</h3>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-[#E7E7EC] text-[10px] font-extrabold text-[#64748b] tracking-wider uppercase">
                <th className="py-4 px-6">Fecha</th>
                <th className="py-4 px-6">Referencia</th>
                <th className="py-4 px-6">Transacción</th>
                <th className="py-4 px-6">Estado</th>
                <th className="py-4 px-6 text-right">Monto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E7E7EC] text-xs">
              {payments.map(p => (
                <tr key={p.reference} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 px-6 text-slate-500 font-medium">{p.date}</td>
                  <td className="py-4 px-6 font-bold text-slate-900">#{p.reference}</td>
                  <td className="py-4 px-6 flex items-center gap-2">
                    {p.type === 'Liquidación' ? (
                      <span className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                        <ArrowUpRight size={14} />
                      </span>
                    ) : (
                      <span className="w-7 h-7 rounded-lg bg-red-50 text-red-600 flex items-center justify-center font-bold">
                        <ArrowDownRight size={14} />
                      </span>
                    )}
                    <span className="font-semibold text-slate-700">{p.type}</span>
                  </td>
                  <td className="py-4 px-6">
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-emerald-100 text-emerald-700">
                      {p.status}
                    </span>
                  </td>
                  <td className={`py-4 px-6 text-right font-extrabold ${
                    p.type === 'Liquidación' ? 'text-emerald-600' : 'text-red-500'
                  }`}>
                    {p.type === 'Liquidación' ? '+' : '-'} RD${p.amount.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

    </div>
  );
}
