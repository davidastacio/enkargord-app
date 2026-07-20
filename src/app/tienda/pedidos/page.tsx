"use client";

import { useState, useEffect } from 'react';
import { 
  Search, 
  Trash2, 
  Copy
} from 'lucide-react';
import Link from 'next/link';
import { collection, query, where, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { useAuth } from '@/hooks/useAuth';

interface OrderRow {
  trackingId: string;
  customerName: string;
  customerPhone: string;
  address: string;
  packageType: string;
  status: 'in_transit' | 'delivered' | 'pending';
  amount: number;
  courierName: string;
  date: string;
}

export default function StoreOrdersList() {
  const { profile } = useAuth();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');

  // Load from Firestore in real-time
  useEffect(() => {
    if (profile?.uid) {
      const q = query(collection(db, 'orders'), where('storeId', '==', profile.uid));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const firestoreOrders = snapshot.docs.map((docSnap) => {
          const o = docSnap.data();
          return {
            trackingId: o.trackingId,
            customerName: o.customer.name,
            customerPhone: o.customer.phone || 'N/A',
            address: o.deliveryAddress.addressLine || o.deliveryAddress.fullAddress,
            packageType: o.packageInfo?.type || 'Paquete pequeño',
            status: o.status === 'in_transit' ? 'in_transit' : o.status === 'delivered' ? 'delivered' : 'pending',
            amount: o.financials.totalCollected,
            courierName: o.courierName || 'No asignado',
            date: o.createdAt ? o.createdAt.split('T')[0] : '2026-07-20'
          };
        });
        setOrders(firestoreOrders as OrderRow[]);
      }, (error) => {
        console.error("Error listening to store orders:", error);
      });
      return () => unsubscribe();
    } else {
      // Fallback to local storage if no user profile is loaded yet
      const local = localStorage.getItem('enkargord_orders');
      if (local) {
        const parsed = JSON.parse(local);
        const mapped = parsed.map((o: any) => ({
          trackingId: o.trackingId,
          customerName: o.customer.name,
          customerPhone: o.customer.phone || 'N/A',
          address: o.deliveryAddress.addressLine || o.deliveryAddress.fullAddress,
          packageType: o.packageInfo?.type || 'Paquete pequeño',
          status: o.status === 'in_transit' ? 'in_transit' : o.status === 'delivered' ? 'delivered' : 'pending',
          amount: o.financials.totalCollected,
          courierName: o.courierName || 'No asignado',
          date: o.createdAt ? o.createdAt.split('T')[0] : '2026-07-20'
        }));
        setOrders(mapped);
      }
    }
  }, [profile]);

  const handleCancelOrder = async (id: string) => {
    if (confirm(`¿Estás seguro de que deseas cancelar la orden #${id}?`)) {
      try {
        // 1. Delete from Firestore database
        await deleteDoc(doc(db, 'orders', id));

        // 2. Sync localStorage cache
        const local = localStorage.getItem('enkargord_orders');
        if (local) {
          const parsed = JSON.parse(local);
          const filtered = parsed.filter((o: any) => o.trackingId !== id);
          localStorage.setItem('enkargord_orders', JSON.stringify(filtered));
        }

        // 3. Fallback manual update in state
        setOrders(orders.filter(o => o.trackingId !== id));
        alert(`Orden #${id} cancelada.`);
      } catch (error) {
        console.error("Error canceling order:", error);
        alert("Error al cancelar la orden de la base de datos.");
      }
    }
  };

  const handleDuplicateOrder = (order: OrderRow) => {
    alert(`Duplicando orden de ${order.customerName}. Revisa tu formulario de creación.`);
  };

  // Filter application
  const filtered = orders.filter(o => {
    const matchSearch = 
      o.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.trackingId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.address.toLowerCase().includes(searchTerm.toLowerCase());

    const matchStatus = statusFilter === 'Todos' || o.status === statusFilter;

    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Page Header */}
      <div>
        <h2 className="text-xl font-extrabold text-slate-950 tracking-tight">Mis Pedidos</h2>
        <p className="text-xs text-slate-400 mt-1 font-medium">
          Consulta y gestiona las guías logísticas registradas.
        </p>
      </div>

      {/* Toolbar Filters */}
      <section className="bg-white border border-[#E7E7EC] rounded-2xl p-5 shadow-sm flex flex-wrap items-center gap-4">
        
        {/* Search */}
        <div className="flex-grow min-w-[240px] relative">
          <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar por tracking, cliente o dirección..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-[#E7E7EC] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#d3121a] focus:bg-white transition-all"
          />
        </div>

        {/* Status */}
        <div className="min-w-[150px]">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-slate-50 border border-[#E7E7EC] rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-[#d3121a] focus:bg-white transition-all"
          >
            <option value="Todos">Todos los Estados</option>
            <option value="in_transit">En tránsito</option>
            <option value="delivered">Entregados</option>
            <option value="pending">Pendientes</option>
          </select>
        </div>

      </section>

      {/* Table grid */}
      <section className="bg-white border border-[#E7E7EC] rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-[#E7E7EC] text-[10px] font-extrabold text-[#64748b] tracking-wider uppercase">
                <th className="py-4 px-6">Tracking</th>
                <th className="py-4 px-6">Cliente</th>
                <th className="py-4 px-6">Teléfono</th>
                <th className="py-4 px-6">Dirección</th>
                <th className="py-4 px-6">Tipo de paquete</th>
                <th className="py-4 px-6">Recaudo</th>
                <th className="py-4 px-6">Estado</th>
                <th className="py-4 px-6">Repartidor</th>
                <th className="py-4 px-6">Fecha</th>
                <th className="py-4 px-6 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E7E7EC] text-xs">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400 font-semibold">
                    No se encontraron guías coincidentes.
                  </td>
                </tr>
              ) : (
                filtered.map((o) => (
                  <tr key={o.trackingId} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6 font-bold text-slate-900">#{o.trackingId}</td>
                    <td className="py-4 px-6 font-semibold text-slate-700">{o.customerName}</td>
                    <td className="py-4 px-6 text-slate-600 font-medium">{o.customerPhone}</td>
                    <td className="py-4 px-6 text-slate-500 max-w-[200px] truncate">{o.address}</td>
                    <td className="py-4 px-6 font-semibold text-[#d3121a]">{o.packageType}</td>
                    <td className="py-4 px-6 font-extrabold text-slate-900">RD${o.amount.toLocaleString()}</td>
                    
                    <td className="py-4 px-6">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide ${
                        o.status === 'delivered'
                          ? 'bg-emerald-100 text-emerald-700'
                          : o.status === 'in_transit'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-slate-100 text-slate-500'
                      }`}>
                        {o.status === 'in_transit' ? 'En tránsito' : o.status === 'delivered' ? 'Entregado' : 'Pendiente'}
                      </span>
                    </td>

                    <td className="py-4 px-6 font-semibold text-slate-700">{o.courierName}</td>
                    <td className="py-4 px-6 text-slate-500 font-medium">{o.date}</td>
                    
                    <td className="py-4 px-6 text-right space-x-1.5">
                      <button 
                        onClick={() => handleDuplicateOrder(o)}
                        className="p-2 border border-[#E7E7EC] rounded-xl hover:bg-slate-50 text-slate-500 inline-flex items-center gap-1.5 text-[10px] font-bold"
                        title="Duplicar pedido"
                      >
                        <Copy size={12} />
                      </button>
                      <button 
                        onClick={() => handleCancelOrder(o.trackingId)}
                        className="p-2 border border-red-200 rounded-xl bg-red-50/30 hover:bg-red-50 text-red-600 inline-flex items-center gap-1.5 text-[10px] font-bold"
                        title="Cancelar envío"
                      >
                        <Trash2 size={12} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

    </div>
  );
}
