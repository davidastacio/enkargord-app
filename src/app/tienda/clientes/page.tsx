"use client";

import { useState, useEffect } from 'react';
import { Search, User, Phone, Mail, Award, Loader2, Package } from 'lucide-react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { useAuth } from '@/hooks/useAuth';

interface ClientItem {
  name: string;
  phone: string;
  email: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate: string;
}

export default function StoreClients() {
  const { profile } = useAuth() as any;
  const [searchTerm, setSearchTerm] = useState('');
  const [clients, setClients] = useState<ClientItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.uid) {
      setLoading(true);
      const storeId = profile.storeId || profile.uid;
      const q = query(collection(db, 'orders'), where('storeId', '==', storeId));

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const clientMap: Record<string, ClientItem> = {};

        snapshot.docs.forEach((docSnap) => {
          const o = docSnap.data();
          const name = o.customerName || 'Cliente';
          const phone = o.customerPhone || 'N/A';
          const email = o.customerEmail || 'N/A';
          const orderDate = o.createdAt ? o.createdAt.split('T')[0] : 'N/A';
          const amount = (o.collectionAmount || 0) + (o.shippingCost || 0);

          if (!clientMap[name]) {
            clientMap[name] = {
              name,
              phone,
              email,
              totalOrders: 0,
              totalSpent: 0,
              lastOrderDate: orderDate
            };
          }

          clientMap[name].totalOrders += 1;
          if (o.status === 'delivered') {
            clientMap[name].totalSpent += amount;
          }
          if (orderDate > clientMap[name].lastOrderDate) {
            clientMap[name].lastOrderDate = orderDate;
          }
        });

        const list = Object.values(clientMap).sort((a, b) => b.totalOrders - a.totalOrders);
        setClients(list);
        setLoading(false);
      }, (error) => {
        console.error("Error loading store clients:", error);
        setLoading(false);
      });

      return () => unsubscribe();
    } else {
      setLoading(false);
    }
  }, [profile]);

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
          Monitorea los clientes frecuentes de tu tienda y sus volúmenes de consumo acumulados desde Firestore.
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
        {loading ? (
          <div className="py-20 text-center flex flex-col items-center justify-center gap-2">
            <Loader2 size={24} className="animate-spin text-[#d3121a]" />
            <span className="text-xs font-bold text-slate-400">Cargando clientes de la tienda...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
            <Package size={36} className="text-slate-300" />
            <p className="font-bold text-slate-600">No hay clientes registrados aún.</p>
            <p className="text-xs text-slate-400 max-w-xs">
              Los clientes aparecerán en esta lista a medida que tu tienda cree envíos para ellos.
            </p>
          </div>
        ) : (
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
                      {c.totalOrders >= 5 ? (
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
        )}
      </section>

    </div>
  );
}
