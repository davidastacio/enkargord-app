"use client";

import { useState } from 'react';
import { Search, User, Phone, Mail, Award } from 'lucide-react';

interface ClientItem {
  name: string;
  phone: string;
  email: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate: string;
}

export default function StoreClients() {
  const [searchTerm, setSearchTerm] = useState('');
  const [clients] = useState<ClientItem[]>([
    { name: "María Rodríguez", phone: "829-555-5678", email: "maria.r@gmail.com", totalOrders: 12, totalSpent: 6850, lastOrderDate: "2026-07-20" },
    { name: "Juan Pérez", phone: "809-555-1234", email: "juan.perez@hotmail.com", totalOrders: 9, totalSpent: 5420, lastOrderDate: "2026-07-20" },
    { name: "Pedro García", phone: "849-555-9012", email: "pedro.g@gmail.com", totalOrders: 7, totalSpent: 4300, lastOrderDate: "2026-07-19" },
    { name: "Ana Martínez", phone: "809-555-4321", email: "ana.martinez@gmail.com", totalOrders: 6, totalSpent: 3980, lastOrderDate: "2026-07-18" },
    { name: "Luis Gómez", phone: "829-555-3250", email: "luis.gomez@gmail.com", totalOrders: 5, totalSpent: 3250, lastOrderDate: "2026-07-16" }
  ]);

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm)
  );

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Header */}
      <div>
        <h2 className="text-xl font-extrabold text-slate-950 tracking-tight">Clientes</h2>
        <p className="text-xs text-slate-400 mt-1 font-medium">
          Monitorea los clientes frecuentes de tu tienda y sus volúmenes de consumo acumulados.
        </p>
      </div>

      {/* Toolbar */}
      <section className="bg-white border border-[#E7E7EC] rounded-2xl p-5 shadow-sm">
        <div className="relative max-w-md">
          <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar por nombre o teléfono de cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-[#E7E7EC] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#d3121a] focus:bg-white transition-all"
          />
        </div>
      </section>

      {/* Table grid */}
      <section className="bg-white border border-[#E7E7EC] rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-[#E7E7EC] text-[10px] font-extrabold text-[#64748b] tracking-wider uppercase">
                <th className="py-4 px-6">Cliente</th>
                <th className="py-4 px-6">Teléfono</th>
                <th className="py-4 px-6">Correo</th>
                <th className="py-4 px-6">Total Pedidos</th>
                <th className="py-4 px-6">Monto Comprado</th>
                <th className="py-4 px-6">Último Pedido</th>
                <th className="py-4 px-6 text-right">Fidelidad</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E7E7EC] text-xs">
              {filtered.map((c) => (
                <tr key={c.name} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 px-6 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#fee2e2] text-[#d3121a] font-extrabold text-xs flex items-center justify-center">
                      {c.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <span className="font-bold text-slate-900">{c.name}</span>
                  </td>
                  <td className="py-4 px-6 font-semibold text-slate-700">{c.phone}</td>
                  <td className="py-4 px-6 text-slate-500 font-medium">{c.email}</td>
                  <td className="py-4 px-6 font-bold text-slate-900">{c.totalOrders} pedidos</td>
                  <td className="py-4 px-6 font-extrabold text-emerald-600">RD${c.totalSpent.toLocaleString()}</td>
                  <td className="py-4 px-6 text-slate-400 font-semibold">{c.lastOrderDate}</td>
                  <td className="py-4 px-6 text-right">
                    {c.totalOrders >= 9 ? (
                      <span className="inline-flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-wide bg-amber-50 text-amber-700 border border-amber-100 rounded-full px-2 py-0.5">
                        <Award size={10} /> VIP
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-wide bg-slate-50 text-slate-500 border border-slate-100 rounded-full px-2 py-0.5">
                        Frecuente
                      </span>
                    )}
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
