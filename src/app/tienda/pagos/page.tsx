"use client";

import { useState, useEffect } from 'react';
import { CreditCard, DollarSign, ArrowUpRight, ArrowDownRight, Loader2, Package } from 'lucide-react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { useAuth } from '@/hooks/useAuth';

interface PaymentRow {
  date: string;
  reference: string;
  type: 'Liquidación' | 'Costo de Envío';
  amount: number;
  status: 'Completado' | 'Pendiente';
}

export default function StorePayments() {
  const { profile } = useAuth() as any;
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.uid) {
      setLoading(true);
      const storeId = profile.storeId || profile.uid;
      const q = query(collection(db, 'orders'), where('storeId', '==', storeId));

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setOrders(list);
        setLoading(false);
      }, (err) => {
        console.error("Error loading store payments:", err);
        setLoading(false);
      });

      return () => unsubscribe();
    } else {
      setLoading(false);
    }
  }, [profile]);

  // Dynamic Financial Calculations from real Firestore orders
  const deliveredOrders = orders.filter(o => o.status === 'delivered');
  const pendingSettlementOrders = orders.filter(o => o.status === 'delivered' && o.settlementStatus !== 'settled');

  const pendingStoreAmount = pendingSettlementOrders.reduce((sum, o) => sum + (o.collectionAmount || 0), 0);
  const totalShippingFees = orders.reduce((sum, o) => sum + (o.shippingCost || 0), 0);
  const totalCodCollected = deliveredOrders.reduce((sum, o) => sum + (o.collectionAmount || 0) + (o.shippingCost || 0), 0);

  // Generate dynamic transactions list from orders
  const payments: PaymentRow[] = deliveredOrders.map(o => ({
    date: o.deliveredAt ? o.deliveredAt.split('T')[0] : (o.createdAt ? o.createdAt.split('T')[0] : 'Hoy'),
    reference: `LIQ-${o.tracking || o.id.slice(0, 6)}`,
    type: 'Liquidación',
    amount: o.collectionAmount || 0,
    status: o.settlementStatus === 'settled' ? 'Completado' : 'Pendiente'
  }));

  if (loading) {
    return (
      <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
        <Loader2 size={28} className="animate-spin text-[#d3121a]" />
        <span className="text-xs font-bold text-slate-400">Cargando datos de pagos y liquidaciones desde Firestore...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Header */}
      <div>
        <h2 className="text-xl font-extrabold text-slate-950 tracking-tight">Pagos y Cobros</h2>
        <p className="text-xs text-slate-400 mt-1 font-medium">
          Controla los balances recaudados por COD en las calles y monitorea tus estados de liquidación en tiempo real.
        </p>
      </div>

      {/* Finance Overview */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-[#E7E7EC] rounded-2xl p-5 shadow-sm space-y-1 flex flex-col justify-between">
          <div>
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Por liquidar a tienda</span>
            <span className="block text-2xl font-extrabold text-emerald-600">RD${pendingStoreAmount.toLocaleString()}</span>
          </div>
          <p className="text-[10px] text-slate-400 font-semibold mt-4">Monto acumulado por entregar</p>
        </div>

        <div className="bg-white border border-[#E7E7EC] rounded-2xl p-5 shadow-sm space-y-1 flex flex-col justify-between">
          <div>
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cargos por Envíos</span>
            <span className="block text-2xl font-extrabold text-[#d3121a]">RD${totalShippingFees.toLocaleString()}</span>
          </div>
          <p className="text-[10px] text-slate-400 font-semibold mt-4">Costo de fletes aplicados</p>
        </div>

        <div className="bg-white border border-[#E7E7EC] rounded-2xl p-5 shadow-sm space-y-1 flex flex-col justify-between">
          <div>
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Recaudado COD</span>
            <span className="block text-2xl font-extrabold text-slate-950">RD${totalCodCollected.toLocaleString()}</span>
          </div>
          <p className="text-[10px] text-slate-400 font-semibold mt-4">Acumulado total entregado</p>
        </div>
      </section>

      {/* Movements Table */}
      <section className="bg-white border border-[#E7E7EC] rounded-2xl overflow-hidden shadow-sm">
        <div className="p-6 border-b border-[#E7E7EC]">
          <h3 className="font-extrabold text-slate-900 text-sm">📋 Historial de Transacciones de Envíos</h3>
        </div>

        {payments.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <Package size={36} className="text-slate-300 mx-auto" />
            <p className="font-bold text-slate-600">No hay transacciones registradas aún.</p>
            <p className="text-xs text-slate-400">Las liquidaciones aparecerán cuando se completen las entregas de la tienda.</p>
          </div>
        ) : (
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
                      <span className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                        <ArrowUpRight size={14} />
                      </span>
                      <span className="font-semibold text-slate-700">{p.type}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${
                        p.status === 'Completado' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right font-extrabold text-emerald-600">
                      + RD${p.amount.toLocaleString()}
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
