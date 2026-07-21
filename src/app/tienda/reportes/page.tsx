"use client";

import { useState, useEffect } from 'react';
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
import { Download, Loader2, Package, TrendingUp } from 'lucide-react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { useAuth } from '@/hooks/useAuth';

export default function StoreReports() {
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
        console.error("Error loading store reports:", err);
        setLoading(false);
      });

      return () => unsubscribe();
    } else {
      setLoading(false);
    }
  }, [profile]);

  // Dynamic Metrics
  const totalOrders = orders.length;
  const deliveredOrders = orders.filter(o => o.status === 'delivered');
  const deliveredCount = deliveredOrders.length;
  const successRate = totalOrders > 0 ? ((deliveredCount / totalOrders) * 100).toFixed(1) : '0';
  const totalCodCollected = deliveredOrders.reduce((sum, o) => sum + (o.collectionAmount || 0) + (o.shippingCost || 0), 0);

  // Group by creation date (last 7 days or entries)
  const dateGroups: Record<string, { ventas: number; entregas: number }> = {};

  orders.forEach(o => {
    const dateStr = o.createdAt ? o.createdAt.split('T')[0] : 'Hoy';
    if (!dateGroups[dateStr]) {
      dateGroups[dateStr] = { ventas: 0, entregas: 0 };
    }
    if (o.status === 'delivered') {
      dateGroups[dateStr].entregas += 1;
      dateGroups[dateStr].ventas += (o.collectionAmount || 0) + (o.shippingCost || 0);
    }
  });

  const chartData = Object.entries(dateGroups)
    .map(([name, val]) => ({ name, ...val }))
    .sort((a, b) => a.name.localeCompare(b.name))
    .slice(-7);

  const handleExportCSV = () => {
    if (orders.length === 0) {
      alert("No hay envíos para exportar.");
      return;
    }
    const headers = ["ID", "Cliente", "Teléfono", "Dirección", "Estado", "Monto", "Fecha"];
    const rows = orders.map(o => [
      o.id,
      `"${o.customerName || ''}"`,
      o.customerPhone || '',
      `"${o.formattedAddress || o.street || ''}"`,
      o.status || '',
      (o.collectionAmount || 0) + (o.shippingCost || 0),
      o.createdAt || ''
    ]);
    const csv = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csv));
    link.setAttribute("download", `Reporte_Tienda_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
        <Loader2 size={28} className="animate-spin text-[#d3121a]" />
        <span className="text-xs font-bold text-slate-400">Generando reportes analíticos desde Firestore...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-slate-950 tracking-tight">Reportes y Estadísticas</h2>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            Consulta el rendimiento comercial y volumen real de despachos de tu tienda.
          </p>
        </div>

        <button 
          onClick={handleExportCSV}
          className="bg-white hover:bg-slate-50 border border-[#E7E7EC] text-slate-700 font-bold text-xs py-2.5 px-4 rounded-xl transition-all flex items-center gap-2 shadow-sm"
        >
          <Download size={14} />
          Exportar Reporte CSV
        </button>
      </div>

      {/* Stats row overview */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-[#E7E7EC] rounded-2xl p-5 shadow-sm space-y-1">
          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Despachos Totales</span>
          <span className="block text-2xl font-extrabold text-slate-950">{totalOrders} Envíos</span>
          <span className="text-[10px] text-emerald-600 font-semibold block">{successRate}% de tasa de éxito de entrega</span>
        </div>

        <div className="bg-white border border-[#E7E7EC] rounded-2xl p-5 shadow-sm space-y-1">
          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ingresos por COD</span>
          <span className="block text-2xl font-extrabold text-emerald-600">RD${totalCodCollected.toLocaleString()}</span>
          <span className="text-[10px] text-slate-400 font-semibold block">Monto total de entregados</span>
        </div>

        <div className="bg-white border border-[#E7E7EC] rounded-2xl p-5 shadow-sm space-y-1">
          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Entregas Exitosas</span>
          <span className="block text-2xl font-extrabold text-slate-950">{deliveredCount} Completados</span>
          <span className="text-[10px] text-emerald-600 font-semibold block">Sincronizado en tiempo real</span>
        </div>
      </section>

      {/* Analytics Charts */}
      {chartData.length === 0 ? (
        <section className="bg-white border border-[#E7E7EC] rounded-2xl p-12 text-center space-y-3 shadow-sm">
          <Package size={36} className="text-slate-300 mx-auto" />
          <h4 className="font-extrabold text-slate-700">Sin datos de envíos suficientes</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Crea tu primer pedido para visualizar los gráficos de ingresos y entregas completadas.
          </p>
        </section>
      ) : (
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Sales charts */}
          <div className="bg-white border border-[#E7E7EC] rounded-2xl p-6 shadow-sm space-y-6">
            <div>
              <h4 className="font-extrabold text-slate-900 text-sm">📈 Ingresos por Ventas (RD$)</h4>
              <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">Monto diario acumulado</span>
            </div>

            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#d3121a" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#d3121a" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E7E7EC" />
                  <XAxis dataKey="name" fontSize={10} stroke="#64748b" />
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
                <BarChart data={chartData}>
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
      )}

    </div>
  );
}
