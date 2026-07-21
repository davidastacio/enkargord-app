"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Package, 
  Truck, 
  CheckCircle, 
  DollarSign, 
  ChevronRight,
  TrendingUp,
  Search,
  Users
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { useAuth } from '@/hooks/useAuth';

interface OrderRow {
  id: string;
  trackingId: string;
  customerName: string;
  customerPhone?: string;
  address: string;
  status: 'in_transit' | 'delivered' | 'pending';
  amount: number;
  courierName: string;
  time: string;
}

interface TopCustomer {
  name: string;
  orders: number;
  spent: number;
  avatar: string;
}

export default function StoreDashboard() {
  const { profile } = useAuth() as any;
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);

  // Load from Firestore in real-time
  useEffect(() => {
    if (profile?.uid) {
      setLoading(true);
      const storeId = profile.storeId || profile.uid;
      const q = query(collection(db, 'orders'), where('storeId', '==', storeId));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const firestoreOrders = snapshot.docs.map((docSnap) => {
          const o = docSnap.data();
          const timeString = o.createdAt 
            ? new Date(o.createdAt).toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' })
            : 'N/A';
          return {
            id: docSnap.id,
            trackingId: o.tracking || o.id,
            customerName: o.customerName || 'Cliente',
            customerPhone: o.customerPhone || '',
            address: o.formattedAddress || o.street || 'Sin dirección',
            status: (o.status === 'in_transit' || o.status === 'on_route' ? 'in_transit' : o.status === 'delivered' ? 'delivered' : 'pending') as OrderRow['status'],
            amount: (o.collectionAmount || 0) + (o.shippingCost || 0),
            courierName: o.courierName || 'No asignado',
            time: timeString
          };
        });
        setOrders(firestoreOrders);
        setLoading(false);
      }, (error) => {
        console.error("Error loading dashboard orders:", error);
        setLoading(false);
      });
      return () => unsubscribe();
    } else {
      setLoading(false);
    }
  }, [profile]);

  // Stats calculation dynamically
  const totalOrdersToday = orders.length;
  const inTransitCount = orders.filter(o => o.status === 'in_transit').length;
  const deliveredCount = orders.filter(o => o.status === 'delivered').length;
  const pendingCount = orders.filter(o => o.status === 'pending').length;
  const totalSales = orders.filter(o => o.status === 'delivered').reduce((sum, o) => sum + o.amount, 0);

  // Dynamic Chart data
  const chartData = [
    { name: 'Entregados', value: deliveredCount, color: '#10b981' },
    { name: 'En Tránsito', value: inTransitCount, color: '#f59e0b' },
    { name: 'Pendientes', value: pendingCount, color: '#64748b' }
  ];

  const totalChartSum = deliveredCount + inTransitCount + pendingCount;

  // Real Top Customers aggregation from store orders
  const customersMap: Record<string, { orders: number; spent: number }> = {};
  orders.forEach((o) => {
    const name = o.customerName || 'Cliente';
    if (!customersMap[name]) {
      customersMap[name] = { orders: 0, spent: 0 };
    }
    customersMap[name].orders += 1;
    if (o.status === 'delivered') {
      customersMap[name].spent += o.amount;
    }
  });

  const topCustomers: TopCustomer[] = Object.entries(customersMap)
    .map(([name, data]) => ({
      name,
      orders: data.orders,
      spent: data.spent,
      avatar: name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'CL'
    }))
    .sort((a, b) => b.spent - a.spent)
    .slice(0, 5);

  const maxSpentValue = topCustomers.length > 0 ? Math.max(...topCustomers.map(c => c.spent), 1) : 1;

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* KPI CARDS BAR */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white border border-[#E7E7EC] rounded-2xl p-5 flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="block text-[10px] font-bold text-slate-400 tracking-wider uppercase">Pedidos Totales</span>
            <span className="block text-3xl font-extrabold text-slate-900">{totalOrdersToday}</span>
            <span className="text-[10px] text-slate-400 font-bold">Registrados en tienda</span>
          </div>
          <div className="w-11 h-11 bg-[#fee2e2] rounded-xl flex items-center justify-center text-[#d3121a] font-bold">
            <Package size={20} />
          </div>
        </div>

        <div className="bg-white border border-[#E7E7EC] rounded-2xl p-5 flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="block text-[10px] font-bold text-slate-400 tracking-wider uppercase">En Tránsito</span>
            <span className="block text-3xl font-extrabold text-[#f59e0b]">{inTransitCount}</span>
            <span className="text-[10px] text-amber-600 font-bold">En ruta activa</span>
          </div>
          <div className="w-11 h-11 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 font-bold">
            <Truck size={20} />
          </div>
        </div>

        <div className="bg-white border border-[#E7E7EC] rounded-2xl p-5 flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="block text-[10px] font-bold text-slate-400 tracking-wider uppercase">Entregados</span>
            <span className="block text-3xl font-extrabold text-emerald-600">{deliveredCount}</span>
            <span className="text-[10px] text-emerald-600 font-bold">Completados</span>
          </div>
          <div className="w-11 h-11 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 font-bold">
            <CheckCircle size={20} />
          </div>
        </div>

        <div className="bg-white border border-[#E7E7EC] rounded-2xl p-5 flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="block text-[10px] font-bold text-slate-400 tracking-wider uppercase">Ingresos por Entregas</span>
            <span className="block text-3xl font-extrabold text-slate-900">RD${totalSales.toLocaleString()}</span>
            <span className="text-[10px] text-slate-400 font-bold">Monto completado</span>
          </div>
          <div className="w-11 h-11 bg-slate-100 rounded-xl flex items-center justify-center text-slate-700 font-bold">
            <DollarSign size={20} />
          </div>
        </div>
      </section>

      {/* DASHBOARD CHARTS & RECENT CONTENT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* RECENT ORDERS TABLE */}
        <section className="lg:col-span-2 bg-white border border-[#E7E7EC] rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between">
          <div>
            <div className="p-6 border-b border-[#E7E7EC] flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">Pedidos Recientes de la Tienda</h3>
                <p className="text-xs text-slate-400 font-medium">Listado en tiempo real desde Firestore</p>
              </div>
              <Link href="/tienda/pedidos" className="text-xs font-extrabold text-[#d3121a] hover:underline flex items-center gap-1">
                Ver todos <ChevronRight size={14} />
              </Link>
            </div>

            {loading ? (
              <div className="p-12 text-center text-xs font-bold text-slate-400">Cargando pedidos de la tienda...</div>
            ) : orders.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <Package size={36} className="text-slate-300 mx-auto" />
                <p className="font-bold text-slate-600">No hay envíos registrados todavía.</p>
                <p className="text-xs text-slate-400">Los pedidos creados por tu tienda aparecerán aquí automáticamente.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-[#E7E7EC] text-[10px] font-extrabold text-slate-400 tracking-wider uppercase">
                      <th className="py-3 px-4">Tracking</th>
                      <th className="py-3 px-4">Cliente</th>
                      <th className="py-3 px-4">Dirección</th>
                      <th className="py-3 px-4">Estado</th>
                      <th className="py-3 px-4 text-right">Monto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E7E7EC]">
                    {orders.slice(0, 6).map((order) => (
                      <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-700">{order.trackingId}</td>
                        <td className="py-3.5 px-4 font-bold text-slate-900">{order.customerName}</td>
                        <td className="py-3.5 px-4 text-slate-500 max-w-xs truncate">{order.address}</td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wide ${
                            order.status === 'delivered' ? 'bg-emerald-100 text-emerald-700' :
                            order.status === 'in_transit' ? 'bg-amber-100 text-amber-700' :
                            'bg-slate-100 text-slate-600'
                          }`}>
                            {order.status === 'delivered' ? 'Entregado' : order.status === 'in_transit' ? 'En ruta' : 'Pendiente'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-slate-900">RD${order.amount.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        {/* STATS RIGHT COLUMN */}
        <div className="space-y-8">
          
          {/* CHART PIE CARD */}
          <section className="bg-white border border-[#E7E7EC] rounded-2xl p-6 shadow-sm space-y-6">
            <h3 className="font-extrabold text-slate-900 text-base">Distribución por Estado</h3>
            {totalChartSum === 0 ? (
              <div className="py-12 text-center text-xs font-semibold text-slate-400">Sin datos de envíos para mostrar gráfico</div>
            ) : (
              <div className="h-[200px] relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={chartData} innerRadius={60} outerRadius={80} paddingAngle={4} dataKey="value">
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute text-center">
                  <span className="block text-2xl font-extrabold text-slate-900">{totalChartSum}</span>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase">Envíos Total</span>
                </div>
              </div>
            )}
          </section>

          {/* TOP CUSTOMERS AGGREGATED */}
          <section className="bg-white border border-[#E7E7EC] rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="font-extrabold text-slate-900 text-base">Top Clientes de la Tienda</h3>
            {topCustomers.length === 0 ? (
              <div className="py-6 text-center text-xs font-semibold text-slate-400">No hay suficientes entregas de clientes</div>
            ) : (
              <div className="space-y-3">
                {topCustomers.map((cust) => (
                  <div key={cust.name} className="flex items-center justify-between text-xs font-semibold p-2.5 bg-slate-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#d3121a]/10 text-[#d3121a] font-extrabold flex items-center justify-center text-xs">
                        {cust.avatar}
                      </div>
                      <div>
                        <span className="font-bold text-slate-800 block">{cust.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{cust.orders} pedidos</span>
                      </div>
                    </div>
                    <span className="font-bold text-slate-900">RD${cust.spent.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </section>

        </div>

      </div>

    </div>
  );
}
