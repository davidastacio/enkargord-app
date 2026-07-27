"use client";

import { useState, useEffect } from 'react';
import { 
  Search, 
  Trash2, 
  Copy,
  FileDown,
  Printer,
  CheckSquare
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { deleteSupabaseOrder, subscribeSupabaseOrders } from '@/lib/supabase/orders';
import { downloadOrdersPdf } from '@/lib/orders/pdf-client';
import { logisticsRegion } from '@/lib/logistics/regions';
import { getOrderFinancials } from '@/lib/orders/financials';

interface OrderRow {
  trackingId: string;
  customerName: string;
  customerPhone: string;
  address: string;
  packageType: string;
  status: 'in_transit' | 'delivered' | 'pending';
  amount: number;
  shippingCost?: number;
  netAmount?: number;
  courierName: string;
  date: string;
  provinceName: string;
  region: string;
}

export default function StoreOrdersList() {
  const { profile, user } = useAuth();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [retryCounter, setRetryCounter] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [dateFilter, setDateFilter] = useState('');
  const [provinceFilter, setProvinceFilter] = useState('Todas');
  const [isDownloading, setIsDownloading] = useState(false);

  // Load from Supabase Realtime
  useEffect(() => {
    if (profile?.uid) {
      setLoading(true);
      setFetchError(null);
      const storeId = profile.storeId || profile.uid;
      
      const unsubscribe = subscribeSupabaseOrders({ storeId }, (supabaseOrders) => {
        const ordersForStore = supabaseOrders.map((o) => {
          const fin = getOrderFinancials(o);
          return {
            trackingId: String(o.tracking || o.id),
            customerName: String(o.customerName || 'Cliente'),
            customerPhone: String(o.customerPhone || 'N/A'),
            address: o.formattedAddress || o.street || 'Sin dirección',
            packageType: String(o.packageType || 'Paquete'),
            status: o.status === 'in_transit' || o.status === 'on_route' ? 'in_transit' : o.status === 'delivered' ? 'delivered' : 'pending',
            amount: fin.totalCollected,
            shippingCost: fin.shippingCost,
            netAmount: fin.netStoreAmount,
            courierName: String(o.courierName || 'No asignado'),
            date: o.createdAt ? o.createdAt.split('T')[0] : 'Hoy',
            provinceName: String(o.provinceName || 'Sin provincia'),
            region: logisticsRegion(String(o.provinceName || '')),
            rawCreatedAt: o.createdAt || ''
          };
        });
        
        // Client-side desc sort to avoid Firestore index builds requirement constraints
        ordersForStore.sort((a, b) => b.rawCreatedAt.localeCompare(a.rawCreatedAt));
        
        setOrders(ordersForStore as unknown as OrderRow[]);
        setLoading(false);
      }, (error) => {
        console.error("Error listening to store orders:", error);
        setFetchError("No pudimos cargar tus pedidos.");
        setOrders([]);
        setLoading(false);
      });
      
      return () => unsubscribe();
    } else {
      setOrders([]);
      setLoading(false);
    }
  }, [profile, retryCounter]);

  const handleCancelOrder = async (id: string) => {
    if (confirm(`¿Estás seguro de que deseas cancelar la orden #${id}?`)) {
      try {
        // 1. Delete from Supabase
        await deleteSupabaseOrder(id);

        // Supabase remains the only source of truth.
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

    const matchDate = !dateFilter || o.date === dateFilter;
    const matchProvince = provinceFilter === 'Todas' || o.provinceName === provinceFilter;
    return matchSearch && matchStatus && matchDate && matchProvince;
  });

  const selectedForDownload = selectedIds.size
    ? filtered.filter((order) => selectedIds.has(order.trackingId))
    : filtered;
  const provinces = Array.from(new Set(orders.map((order) => order.provinceName))).sort();

  const handlePdf = async (mode: 'orders' | 'labels', ids = selectedForDownload.map((order) => order.trackingId)) => {
    if (!user || !ids.length || isDownloading) return;
    setIsDownloading(true);
    try {
      await downloadOrdersPdf(user, ids, mode);
    } catch (error) {
      console.error(error);
      alert('No se pudo generar el PDF.');
    } finally {
      setIsDownloading(false);
    }
  };

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

        <input
          type="date"
          value={dateFilter}
          onChange={(event) => setDateFilter(event.target.value)}
          className="bg-slate-50 border border-[#E7E7EC] rounded-xl px-4 py-2.5 text-xs font-semibold"
        />
        <select
          value={provinceFilter}
          onChange={(event) => setProvinceFilter(event.target.value)}
          className="min-w-[170px] bg-slate-50 border border-[#E7E7EC] rounded-xl px-4 py-2.5 text-xs font-semibold"
        >
          <option value="Todas">Todas las provincias</option>
          {provinces.map((province) => <option key={province} value={province}>{province}</option>)}
        </select>
        <button
          type="button"
          onClick={() => setSelectedIds(new Set(filtered.map((order) => order.trackingId)))}
          className="inline-flex items-center gap-2 border border-[#E7E7EC] rounded-xl px-4 py-2.5 text-xs font-bold text-slate-600"
        >
          <CheckSquare size={14} /> Seleccionar visibles
        </button>
        <button
          type="button"
          disabled={isDownloading || selectedForDownload.length === 0}
          onClick={() => void handlePdf('orders')}
          className="inline-flex items-center gap-2 bg-slate-900 text-white rounded-xl px-4 py-2.5 text-xs font-bold disabled:opacity-40"
        >
          <FileDown size={14} /> PDF ({selectedForDownload.length})
        </button>
        <button
          type="button"
          disabled={isDownloading || selectedForDownload.length === 0}
          onClick={() => void handlePdf('labels')}
          className="inline-flex items-center gap-2 bg-[#d3121a] text-white rounded-xl px-4 py-2.5 text-xs font-bold disabled:opacity-40"
        >
          <Printer size={14} /> Labels ({selectedForDownload.length})
        </button>

      </section>

      {/* Table grid */}
      <section className="bg-white border border-[#E7E7EC] rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-[#E7E7EC] text-[10px] font-extrabold text-[#64748b] tracking-wider uppercase">
                <th className="py-4 px-4">Sel.</th>
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
              {loading ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400 font-semibold">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin"></div>
                      Cargando tus pedidos...
                    </div>
                  </td>
                </tr>
              ) : fetchError ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-500 font-semibold space-y-3">
                    <p>{fetchError}</p>
                    <button 
                      onClick={() => setRetryCounter(prev => prev + 1)} 
                      className="px-4 py-2 border border-[#E7E7EC] rounded-xl hover:bg-slate-50 text-slate-700 font-extrabold text-[10px] uppercase tracking-wider"
                    >
                      Reintentar
                    </button>
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400 font-semibold">
                    Aún no tienes pedidos registrados.
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400 font-semibold">
                    No se encontraron guías coincidentes.
                  </td>
                </tr>
              ) : (
                filtered.map((o) => (
                  <tr key={o.trackingId} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(o.trackingId)}
                        onChange={() => setSelectedIds((previous) => {
                          const next = new Set(previous);
                          if (next.has(o.trackingId)) next.delete(o.trackingId);
                          else next.add(o.trackingId);
                          return next;
                        })}
                        aria-label={`Seleccionar ${o.trackingId}`}
                      />
                    </td>
                    <td className="py-4 px-6 font-bold text-slate-900">
                      <Link href={`/tienda/pedidos/${o.trackingId}`} className="hover:underline">
                        #{o.trackingId}
                      </Link>
                    </td>
                    <td className="py-4 px-6 font-semibold text-slate-700">{o.customerName}</td>
                    <td className="py-4 px-6 text-slate-600 font-medium">{o.customerPhone}</td>
                    <td className="py-4 px-6 text-slate-500 max-w-[200px] truncate">{o.address}</td>
                    <td className="py-4 px-6 font-semibold text-[#d3121a]">{o.packageType}</td>
                    <td className="py-4 px-6 font-extrabold text-slate-900">
                      {profile?.role === 'Colaborador' ? (
                        '***'
                      ) : (
                        <div>
                          <span className="block text-slate-900">RD${o.amount.toLocaleString()}</span>
                          <span className="block text-[10px] text-emerald-600 font-bold">
                            Neto: RD${(o.netAmount ?? Math.max(0, o.amount - (o.shippingCost || 0))).toLocaleString()}
                          </span>
                        </div>
                      )}
                    </td>
                    
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
                        onClick={() => void handlePdf('labels', [o.trackingId])}
                        className="p-2 border border-blue-200 rounded-xl bg-blue-50 text-blue-700 inline-flex"
                        title="Descargar label PDF"
                      >
                        <Printer size={12} />
                      </button>
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
