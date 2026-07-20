"use client";

import { useState, useEffect } from 'react';
import {
  Package,
  Phone,
  MessageCircle,
  MapPin,
  Download,
  Printer,
  CheckCircle2,
  Clock,
  AlertCircle,
  Search,
  Filter,
  ExternalLink,
} from 'lucide-react';
import { DEFAULT_ORDERS, type CourierOrder, type OrderStatus, buildWhatsAppUrl, DEFAULT_WHATSAPP_TEMPLATES } from '@/data/courier';

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; bg: string }> = {
  assigned:          { label: 'Asignado',            color: 'text-slate-700',   bg: 'bg-slate-100' },
  picked_up:         { label: 'Recogido',             color: 'text-blue-700',    bg: 'bg-blue-50' },
  on_route:          { label: 'En ruta',              color: 'text-blue-700',    bg: 'bg-blue-50' },
  next_delivery:     { label: 'Próximo',              color: 'text-violet-700',  bg: 'bg-violet-50' },
  no_answer:         { label: 'No contesta',          color: 'text-red-700',     bg: 'bg-red-50' },
  rescheduled:       { label: 'Reprogramado',         color: 'text-amber-700',   bg: 'bg-amber-50' },
  delivered:         { label: 'Entregado',            color: 'text-emerald-700', bg: 'bg-emerald-50' },
  failed_delivery:   { label: 'Entrega fallida',      color: 'text-red-700',     bg: 'bg-red-50' },
  returned:          { label: 'Devuelto',             color: 'text-orange-700',  bg: 'bg-orange-50' },
  pending_settlement:{ label: 'Pend. liquidación',   color: 'text-orange-700',  bg: 'bg-orange-50' },
  settled:           { label: 'Liquidado',            color: 'text-emerald-700', bg: 'bg-emerald-50' },
};

function printLabel(order: CourierOrder) {
  const win = window.open('', '_blank', 'width=400,height=600');
  if (!win) return;
  win.document.write(`
    <!DOCTYPE html>
    <html><head><title>Label ${order.trackingId}</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 0; padding: 16px; font-size: 11px; }
      .header { text-align: center; border-bottom: 2px solid #d3121a; padding-bottom: 8px; margin-bottom: 8px; }
      .brand { color: #d3121a; font-size: 18px; font-weight: 900; }
      .tracking { font-size: 20px; font-weight: 900; letter-spacing: 2px; text-align: center; margin: 8px 0; background: #f1f5f9; padding: 6px; border-radius: 6px; }
      .row { display: flex; justify-content: space-between; margin: 3px 0; }
      .label { color: #64748b; font-weight: 600; }
      .value { font-weight: 700; }
      .section { border-top: 1px solid #e2e8f0; margin-top: 8px; padding-top: 8px; }
      .amount { font-size: 16px; font-weight: 900; color: #d3121a; text-align: center; margin: 8px 0; }
      .footer { font-size: 9px; text-align: center; color: #94a3b8; margin-top: 12px; }
      @media print { body { margin: 0; } }
    </style></head><body>
    <div class="header">
      <div class="brand">EnkargoRD</div>
      <div style="font-size:9px; color:#64748b;">Sistema de Entregas · enkargord.com</div>
    </div>
    <div class="tracking">${order.trackingId}</div>
    <div class="section">
      <div class="row"><span class="label">Cliente:</span><span class="value">${order.customer.name}</span></div>
      <div class="row"><span class="label">Teléfono:</span><span class="value">${order.customer.phone}</span></div>
    </div>
    <div class="section">
      <div class="row"><span class="label">Provincia:</span><span class="value">${order.deliveryAddress.provinceName}</span></div>
      <div class="row"><span class="label">Municipio:</span><span class="value">${order.deliveryAddress.municipalityName ?? '-'}</span></div>
      <div class="row"><span class="label">Sector:</span><span class="value">${order.deliveryAddress.sectorName ?? '-'}</span></div>
      <div class="row"><span class="label">Dirección:</span><span class="value">${order.deliveryAddress.fullAddress}</span></div>
      ${order.deliveryAddress.reference ? `<div class="row"><span class="label">Referencia:</span><span class="value">${order.deliveryAddress.reference}</span></div>` : ''}
    </div>
    <div class="section">
      <div class="row"><span class="label">Tienda:</span><span class="value">${order.storeName}</span></div>
      <div class="row"><span class="label">Fulfillment:</span><span class="value">${order.fulfillment.required ? 'Sí' : 'No'}</span></div>
    </div>
    <div class="amount">RD$${order.financials.orderCollectionAmount.toLocaleString()}</div>
    <div class="footer">Generado por EnkargoRD · No incluye datos de productos</div>
    </body></html>
  `);
  win.document.close();
  win.print();
}

export default function PedidosPage() {
  const [orders, setOrders] = useState<CourierOrder[]>([]);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<OrderStatus | 'all'>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [templateKey, setTemplateKey] = useState(0);

  useEffect(() => {
    const stored = localStorage.getItem('enkargord_courier_orders');
    setOrders(stored ? JSON.parse(stored) : DEFAULT_ORDERS);
  }, []);

  const myOrders = orders.filter((o) => o.courierId === 'COU-001');
  const filtered = myOrders.filter((o) => {
    const matchSearch =
      o.customer.name.toLowerCase().includes(search.toLowerCase()) ||
      o.trackingId.toLowerCase().includes(search.toLowerCase()) ||
      o.deliveryAddress.fullAddress.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || o.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const printSelected = () => {
    const toPrint = filtered.filter((o) => selectedIds.has(o.id));
    toPrint.forEach((o) => printLabel(o));
  };

  return (
    <div className="space-y-5 max-w-2xl mx-auto lg:max-w-full">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">Pedidos asignados</h2>
          <p className="text-sm text-slate-400 mt-0.5">{myOrders.length} pedidos en tu lista hoy</p>
        </div>
        {selectedIds.size > 0 && (
          <button
            onClick={printSelected}
            className="flex items-center gap-2 bg-[#d3121a] text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md shadow-red-100 hover:bg-[#b00f14] transition-all"
          >
            <Printer size={14} />
            Imprimir {selectedIds.size} label{selectedIds.size > 1 ? 's' : ''}
          </button>
        )}
      </div>

      {/* Search & Filter */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar cliente, tracking o dirección..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-[#E7E7EC] rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#d3121a]/20 focus:border-[#d3121a]"
          />
        </div>
        <div className="relative">
          <Filter size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as OrderStatus | 'all')}
            className="pl-9 pr-4 py-2.5 text-sm border border-[#E7E7EC] rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#d3121a]/20 focus:border-[#d3121a] appearance-none"
          >
            <option value="all">Todos</option>
            {(Object.entries(STATUS_CONFIG) as [OrderStatus, { label: string }][]).map(([key, s]) => (
              <option key={key} value={key}>{s.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Order Cards */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="bg-white border border-[#E7E7EC] rounded-2xl p-8 text-center">
            <Package size={36} className="text-slate-300 mx-auto mb-3" />
            <p className="font-bold text-slate-500">No se encontraron pedidos</p>
          </div>
        )}
        {filtered.map((order) => {
          const st = STATUS_CONFIG[order.status];
          const isSelected = selectedIds.has(order.id);
          const template = DEFAULT_WHATSAPP_TEMPLATES[templateKey];
          const waUrl = buildWhatsAppUrl(
            order.customer.phone,
            template.template,
            { motorista: 'Carlos Martínez', tienda: order.storeName, tracking: order.trackingId }
          );

          return (
            <div
              key={order.id}
              className={`bg-white border rounded-2xl p-4 shadow-sm transition-all ${
                isSelected ? 'border-[#d3121a] ring-2 ring-[#d3121a]/10' : 'border-[#E7E7EC]'
              }`}
            >
              {/* Header Row */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelect(order.id)}
                    className="w-4 h-4 rounded accent-[#d3121a] cursor-pointer flex-shrink-0"
                  />
                  <div>
                    <div className="font-extrabold text-slate-800 text-sm">{order.customer.name}</div>
                    <div className="text-[10px] font-bold text-slate-400 font-mono mt-0.5">{order.trackingId}</div>
                  </div>
                </div>
                <span className={`text-[10px] font-extrabold px-2 py-1 rounded-full flex-shrink-0 ${st.bg} ${st.color}`}>
                  {st.label}
                </span>
              </div>

              {/* Address */}
              <div className="flex items-start gap-2 mb-3">
                <MapPin size={13} className="text-slate-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-slate-600 flex-1">{order.deliveryAddress.fullAddress}</p>
              </div>

              {/* Financial & Fulfillment badges */}
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="text-xs font-extrabold bg-[#fee2e2] text-[#d3121a] px-2.5 py-1 rounded-full">
                  RD${order.financials.orderCollectionAmount.toLocaleString()}
                </span>
                {order.fulfillment.required && (
                  <span className="text-[10px] font-bold bg-violet-50 text-violet-700 px-2 py-0.5 rounded-full">
                    Fulfillment
                  </span>
                )}
                <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                  #{order.routeOrder ?? '-'} en ruta
                </span>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-3 gap-2">
                <a
                  href={`tel:${order.customer.phone}`}
                  className="flex items-center justify-center gap-1.5 py-2.5 bg-slate-50 hover:bg-slate-100 border border-[#E7E7EC] rounded-xl text-xs font-bold text-slate-700 transition-all"
                >
                  <Phone size={13} /> Llamar
                </a>
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-1.5 py-2.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-700 transition-all"
                >
                  <MessageCircle size={13} /> WA
                </a>
                <button
                  onClick={() => printLabel(order)}
                  className="flex items-center justify-center gap-1.5 py-2.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl text-xs font-bold text-blue-700 transition-all"
                >
                  <Printer size={13} /> Label
                </button>
              </div>

              {/* WhatsApp template selector */}
              <div className="mt-3 flex items-center gap-2">
                <span className="text-[10px] text-slate-400 font-semibold">Plantilla WA:</span>
                <div className="flex-1 overflow-x-auto flex gap-1.5">
                  {DEFAULT_WHATSAPP_TEMPLATES.map((t, idx) => (
                    <button
                      key={t.key}
                      onClick={() => setTemplateKey(idx)}
                      className={`flex-shrink-0 text-[9px] font-bold px-2 py-1 rounded-lg border transition-all ${
                        templateKey === idx
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Batch print all */}
      {filtered.length > 0 && (
        <button
          onClick={() => filtered.forEach(printLabel)}
          className="w-full flex items-center justify-center gap-2 py-3 border border-dashed border-[#E7E7EC] rounded-2xl text-sm font-bold text-slate-400 hover:text-slate-600 hover:border-slate-300 transition-all"
        >
          <Download size={15} />
          Imprimir todos los labels ({filtered.length})
        </button>
      )}
    </div>
  );
}
