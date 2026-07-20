"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Package, 
  Truck, 
  CheckCircle, 
  DollarSign, 
  MapPin, 
  ChevronRight,
  TrendingUp,
  MoreVertical
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import MapComponent from '@/components/MapComponent';

interface OrderRow {
  trackingId: string;
  customerName: string;
  address: string;
  status: 'in_transit' | 'delivered' | 'pending';
  amount: number;
  courierName: string;
  time: string;
}

export default function StoreDashboard() {
  const [orders, setOrders] = useState<OrderRow[]>([
    { trackingId: 'ENK-1250', customerName: 'Juan Pérez', address: 'Av. Winston Churchill, 45', status: 'in_transit', amount: 1250, courierName: 'Carlos M.', time: '10:30 AM' },
    { trackingId: 'ENK-1249', customerName: 'María Rodríguez', address: 'C/ José Contreras, 12', status: 'delivered', amount: 980, courierName: 'Luis A.', time: '10:15 AM' },
    { trackingId: 'ENK-1248', customerName: 'Pedro García', address: 'C/ El Conde, 98', status: 'pending', amount: 1100, courierName: 'Sin asignar', time: '09:58 AM' },
    { trackingId: 'ENK-1247', customerName: 'Ana Martínez', address: 'Av. 27 de Febrero, 123', status: 'in_transit', amount: 1650, courierName: 'Yoselin V.', time: '09:42 AM' },
    { trackingId: 'ENK-1246', customerName: 'Luis Gómez', address: 'C/ San Vicente de Paúl, 34', status: 'delivered', amount: 750, courierName: 'Carlos M.', time: '09:30 AM' }
  ]);

  // Load from local storage if exists
  useEffect(() => {
    const local = localStorage.getItem('enkargord_orders');
    if (local) {
      const parsed = JSON.parse(local);
      // Map global orders list into store rows for preview
      const mapped = parsed.map((o: any) => ({
        trackingId: o.trackingId,
        customerName: o.customer.name,
        address: o.deliveryAddress.addressLine,
        status: o.status === 'in_transit' ? 'in_transit' : o.status === 'delivered' ? 'delivered' : 'pending',
        amount: o.financials.totalCollected,
        courierName: o.courierName,
        time: o.time
      })).slice(0, 5);
      setOrders(mapped);
    }
  }, []);

  // Stats calculation
  const totalOrdersToday = 48;
  const inTransitCount = orders.filter(o => o.status === 'in_transit').length + 15;
  const deliveredCount = orders.filter(o => o.status === 'delivered').length + 24;
  const totalSales = 68450;

  // Chart data
  const chartData = [
    { name: 'Entregados', value: deliveredCount, color: '#10b981' },
    { name: 'En Tránsito', value: inTransitCount, color: '#f59e0b' },
    { name: 'Pendientes', value: orders.filter(o => o.status === 'pending').length + 2, color: '#64748b' }
  ];

  const totalChartSum = chartData.reduce((sum, item) => sum + item.value, 0);

  // Top Customers mockup ranking list
  const topCustomers = [
    { name: 'María Rodríguez', orders: 12, spent: 6850, avatar: 'MR' },
    { name: 'Juan Pérez', orders: 9, spent: 5420, avatar: 'JP' },
    { name: 'Pedro García', orders: 7, spent: 4300, avatar: 'PG' },
    { name: 'Ana Martínez', orders: 6, spent: 3980, avatar: 'AM' },
    { name: 'Luis Gómez', orders: 5, spent: 3250, avatar: 'LG' }
  ];

  const maxSpentValue = 6850;

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* ==========================================
         KPI CARDS BAR
         ========================================== */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* KPI 1 */}
        <div className="bg-white border border-[#E7E7EC] rounded-2xl p-5 flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="block text-[10px] font-bold text-slate-400 tracking-wider uppercase">
              Pedidos de hoy
            </span>
            <span className="block text-3xl font-extrabold text-slate-900">
              {totalOrdersToday}
            </span>
            <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
              <TrendingUp size={12} /> +20.0% vs ayer
            </span>
          </div>
          <div className="w-11 h-11 bg-[#fee2e2] rounded-xl flex items-center justify-center text-[#d3121a] font-bold">
            <Package size={20} />
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-white border border-[#E7E7EC] rounded-2xl p-5 flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="block text-[10px] font-bold text-slate-400 tracking-wider uppercase">
              En tránsito
            </span>
            <span className="block text-3xl font-extrabold text-slate-900">
              {inTransitCount}
            </span>
            <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
              <TrendingUp size={12} /> +12.5% vs ayer
            </span>
          </div>
          <div className="w-11 h-11 bg-[#fee2e2] rounded-xl flex items-center justify-center text-[#d3121a] font-bold">
            <Truck size={20} />
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-white border border-[#E7E7EC] rounded-2xl p-5 flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="block text-[10px] font-bold text-slate-400 tracking-wider uppercase">
              Entregados
            </span>
            <span className="block text-3xl font-extrabold text-slate-900">
              {deliveredCount}
            </span>
            <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
              <TrendingUp size={12} /> +8.3% vs ayer
            </span>
          </div>
          <div className="w-11 h-11 bg-[#fee2e2] rounded-xl flex items-center justify-center text-[#d3121a] font-bold">
            <CheckCircle size={20} />
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-white border border-[#E7E7EC] rounded-2xl p-5 flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="block text-[10px] font-bold text-slate-400 tracking-wider uppercase">
              Ventas del día
            </span>
            <span className="block text-2xl font-extrabold text-slate-900">
              RD${totalSales.toLocaleString()}
            </span>
            <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
              <TrendingUp size={12} /> +18.6% vs ayer
            </span>
          </div>
          <div className="w-11 h-11 bg-[#fee2e2] rounded-xl flex items-center justify-center text-[#d3121a] font-bold">
            <DollarSign size={20} />
          </div>
        </div>

      </section>

      {/* ==========================================
         SECCIÓN PEDIDOS RECIENTES
         ========================================== */}
      <section className="bg-white border border-[#E7E7EC] rounded-2xl overflow-hidden shadow-sm">
        <div className="p-6 border-b border-[#E7E7EC] flex items-center justify-between">
          <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
            🔴 Pedidos recientes
          </h3>
          <Link 
            href="/tienda/pedidos" 
            className="text-xs font-bold text-[#d3121a] hover:underline flex items-center gap-1"
          >
            Ver todos los pedidos
            <ChevronRight size={14} />
          </Link>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-[#E7E7EC] text-[10px] font-extrabold text-[#64748b] tracking-wider uppercase">
                <th className="py-4 px-6">Tracking</th>
                <th className="py-4 px-6">Cliente</th>
                <th className="py-4 px-6">Dirección</th>
                <th className="py-4 px-6">Estado</th>
                <th className="py-4 px-6">Recaudo</th>
                <th className="py-4 px-6">Repartidor</th>
                <th className="py-4 px-6">Hora</th>
                <th className="py-4 px-6 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E7E7EC] text-xs">
              {orders.map((o) => (
                <tr key={o.trackingId} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 px-6 font-bold text-slate-900">#{o.trackingId}</td>
                  <td className="py-4 px-6 font-semibold text-slate-700">{o.customerName}</td>
                  <td className="py-4 px-6 text-slate-500 max-w-[200px] truncate">{o.address}</td>
                  
                  {/* Status Badges */}
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

                  <td className="py-4 px-6 font-bold text-slate-900">RD${o.amount.toLocaleString()}</td>
                  <td className="py-4 px-6 font-semibold text-slate-700">{o.courierName}</td>
                  <td className="py-4 px-6 text-slate-500 font-medium">{o.time}</td>
                  
                  <td className="py-4 px-6 text-right flex items-center justify-end gap-2">
                    {o.status === 'in_transit' ? (
                      <Link 
                        href="/tienda/seguimiento"
                        className="bg-[#d3121a]/10 hover:bg-[#d3121a] text-[#d3121a] hover:text-white font-extrabold text-[10px] py-1.5 px-3 rounded-lg border border-[#d3121a]/20 transition-all uppercase tracking-wide"
                      >
                        Rastrear
                      </Link>
                    ) : (
                      <Link 
                        href="/tienda/pedidos"
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-[10px] py-1.5 px-3 rounded-lg border border-slate-200 transition-all uppercase tracking-wide"
                      >
                        Ver
                      </Link>
                    )}
                    <button className="text-slate-400 hover:text-slate-700 p-1">
                      <MoreVertical size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ==========================================
         SECCIÓN INFERIOR (MAPA, GRÁFICO, CLIENTES)
         ========================================== */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Block 1: Tracking map mini */}
        <div className="bg-white border border-[#E7E7EC] rounded-2xl p-6 shadow-sm lg:col-span-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h4 className="font-extrabold text-slate-800 text-sm">
              🔴 Seguimiento en tiempo real
            </h4>
            <Link 
              href="/tienda/seguimiento" 
              className="text-xs font-bold text-[#d3121a] hover:underline"
            >
              Ver todas las rutas
            </Link>
          </div>

          <div className="w-full h-[260px] rounded-xl overflow-hidden relative">
            <MapComponent activeCouriers={[
              { name: "Carlos M.", status: "Activo", lat: 18.4795, lng: -69.9326, pendingCount: 1 },
              { name: "Yoselin V.", status: "Activo", lat: 18.4735, lng: -69.8860, pendingCount: 1 }
            ]} />
          </div>
        </div>

        {/* Block 2: Recharts Donut chart */}
        <div className="bg-white border border-[#E7E7EC] rounded-2xl p-6 shadow-sm lg:col-span-3 flex flex-col justify-between gap-4">
          <div>
            <h4 className="font-extrabold text-slate-800 text-sm">
              🔴 Estado de pedidos
            </h4>
          </div>

          <div className="h-[140px] w-full relative flex items-center justify-center">
            <div className="absolute text-center flex flex-col justify-center">
              <span className="text-2xl font-extrabold text-slate-900">{totalChartSum}</span>
              <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wide">pedidos</span>
            </div>

            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={58}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-1.5 mt-2">
            {chartData.map(item => (
              <div key={item.name} className="flex items-center justify-between text-[11px] font-bold text-slate-600">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></span>
                  <span>{item.name}</span>
                </div>
                <span className="text-slate-900">{item.value} ({Math.round((item.value / totalChartSum) * 100)}%)</span>
              </div>
            ))}
          </div>
        </div>

        {/* Block 3: Top Customers list */}
        <div className="bg-white border border-[#E7E7EC] rounded-2xl p-6 shadow-sm lg:col-span-4 flex flex-col justify-between gap-4">
          <div className="flex items-center justify-between">
            <h4 className="font-extrabold text-slate-800 text-sm">
              🔴 Top clientes
            </h4>
            <Link 
              href="/tienda/clientes" 
              className="text-xs font-bold text-[#d3121a] hover:underline"
            >
              Ver todos
            </Link>
          </div>

          <div className="space-y-4">
            {topCustomers.map((c, i) => (
              <div key={c.name} className="flex items-center gap-3">
                <span className="text-xs font-extrabold text-slate-400 w-4">{i + 1}</span>
                <div className="w-8 h-8 rounded-full bg-[#d3121a]/10 text-[#d3121a] font-extrabold text-xs flex items-center justify-center">
                  {c.avatar}
                </div>
                
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                    <span>{c.name}</span>
                    <span>RD${c.spent.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-[9px] font-bold text-slate-400">
                    <span>{c.orders} pedidos</span>
                  </div>
                  <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[#d3121a]" 
                      style={{ width: `${(c.spent / maxSpentValue) * 100}%` }}
                    ></div>
                  </div>
                </div>

              </div>
            ))}
          </div>
        </div>

      </section>

    </div>
  );
}
