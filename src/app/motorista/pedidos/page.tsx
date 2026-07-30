"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
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
import { type CourierOrder, type OrderStatus, buildWhatsAppUrl, DEFAULT_WHATSAPP_TEMPLATES } from '@/data/courier';
import { useAuth } from '@/hooks/useAuth';
import { subscribeSupabaseOrders } from '@/lib/supabase/orders';
import WhatsAppContactButton from '@/components/WhatsAppContactButton';
import { downloadOrdersPdf } from '@/lib/orders/pdf-client';
import { getOrderFinancials } from '@/lib/orders/financials';

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

const escapeHtml = (value: unknown) =>
  String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;',
  })[character] || character);

const ASSIGNED_ORDER_STATUSES = new Set([
  'assigned',
  'picked_up',
  'in_transit',
  'on_route',
  'next_delivery',
  'rescheduled',
]);

function printLabel(order: CourierOrder) {
  const win = window.open('', '_blank', 'width=400,height=600');
  if (!win) return;
  const storeName = escapeHtml(order.storeName || 'Tienda');
  const totalToCollect = Number(order.financials.orderCollectionAmount || 0);
  const shippingAmount = Number(order.financials.shippingCost || 0);
  const productAmount = Math.max(0, totalToCollect - shippingAmount);
  win.document.write(`
    <!DOCTYPE html>
    <html><head><title>Etiqueta ${escapeHtml(order.trackingId)}</title>
    <style>
      @page { size: 4in 6in; margin: 0; }
      * { box-sizing: border-box; }
      body { font-family: Arial, sans-serif; margin: 0; color: #111827; }
      .sheet { width: 4in; height: 6in; border: 1.5px solid #111827; padding: 0; overflow: hidden; }
      .header { background: #111827; color: white; padding: 15px 16px 12px; }
      .brand { font-size: 21px; font-weight: 900; line-height: 1.1; }
      .eyebrow { margin-top: 4px; color: #cbd5e1; font-size: 8px; font-weight: 800; letter-spacing: 1.4px; }
      .content { padding: 13px 16px; }
      .caption { color: #64748b; font-size: 8px; font-weight: 800; letter-spacing: 1.2px; text-transform: uppercase; }
      .tracking { font-size: 22px; font-weight: 900; letter-spacing: 1px; margin: 4px 0 10px; padding-bottom: 10px; border-bottom: 1px solid #cbd5e1; }
      .recipient { font-size: 17px; font-weight: 900; margin-top: 4px; }
      .phone { font-size: 12px; font-weight: 800; margin-top: 3px; }
      .block { margin-top: 12px; }
      .value { margin-top: 3px; font-size: 11px; font-weight: 700; line-height: 1.35; }
      .reference { font-size: 10px; margin-top: 6px; color: #475569; }
      .summary { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 14px; padding: 11px; background: #f1f5f9; border-radius: 7px; }
      .summary-value { font-size: 14px; font-weight: 900; margin-top: 4px; }
      .amount { color: #d3121a; font-size: 18px; }
      .footer { display: flex; justify-content: space-between; font-size: 8px; color: #64748b; margin-top: 13px; }
      @media print { body { margin: 0; } .sheet { border-color: #111827; } }
    </style></head><body>
    <main class="sheet">
      <header class="header">
        <div class="brand">${storeName}</div>
        <div class="eyebrow">ETIQUETA DE ENVÍO</div>
      </header>
      <div class="content">
        <div class="caption">Guía</div>
        <div class="tracking">${escapeHtml(order.trackingId)}</div>
        <div class="caption">Entregar a</div>
        <div class="recipient">${escapeHtml(order.customer.name)}</div>
        <div class="phone">${escapeHtml(order.customer.phone)}</div>
        <div class="block">
          <div class="caption">Destino</div>
          <div class="value">${escapeHtml([order.deliveryAddress.sectorName, order.deliveryAddress.municipalityName, order.deliveryAddress.provinceName].filter(Boolean).join(', '))}</div>
        </div>
        <div class="block">
          <div class="caption">Dirección</div>
          <div class="value">${escapeHtml(order.deliveryAddress.fullAddress)}</div>
          ${order.deliveryAddress.reference ? `<div class="reference"><strong>Referencia:</strong> ${escapeHtml(order.deliveryAddress.reference)}</div>` : ''}
        </div>
        <div class="summary">
          <div><div class="caption">Paquete</div><div class="summary-value">${order.fulfillment.required ? 'Fulfillment' : 'Paquete'}</div></div>
          <div>
            <div class="caption">Total a cobrar</div>
            <div class="summary-value amount">RD$${totalToCollect.toLocaleString()}</div>
            <div style="font-size:7px;color:#64748b;margin-top:2px;">Monto total (incluye flete RD$${shippingAmount.toLocaleString()})</div>
          </div>
        </div>
        <div class="footer"><span>${escapeHtml(new Date(order.createdAt).toLocaleDateString('es-DO'))}</span><span>Gestionado por EnkargoRD</span></div>
      </div>
    </main>
    </body></html>
  `);
  win.document.close();
  win.print();
}

export default function PedidosPage() {
  const { profile, user } = useAuth() as any;
  const [orders, setOrders] = useState<CourierOrder[]>([]);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<OrderStatus | 'all'>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [templateKey, setTemplateKey] = useState(0);

  // Load from Supabase Realtime matching courierId
  useEffect(() => {
    if (profile?.courierId) {
      const unsubscribe = subscribeSupabaseOrders({ courierId: profile.courierId }, (supabaseOrders) => {
        const firestoreOrders = supabaseOrders.map((o: any) => {
          const financials = getOrderFinancials(o);
          const mappedStatus = o.status === 'customer_unreachable' ? 'no_answer' : o.status;
          return {
            id: o.id,
            trackingId: o.tracking || o.id,
            status: mappedStatus as OrderStatus,
            storeId: o.storeId || 'STORE_01',
            storeName: o.storeName || 'Tienda Enkargo',
            productName: o.productName || o.packageDescription || 'Producto no especificado',
            packageDescription: o.packageDescription || '',
            courierId: o.courierId || '',
            courierName: o.courierName || '',
            createdAt: o.createdAt || new Date().toISOString(),
            customer: {
              name: o.customerName || 'Cliente',
              phone: o.customerPhone || '',
              email: o.customerEmail || ''
            },
            deliveryAddress: {
              addressLine: o.formattedAddress || o.street || '',
              provinceId: o.provinceId || '',
              provinceName: o.provinceName || '',
              municipalityId: o.municipalityId || '',
              municipalityName: o.municipalityName || '',
              sectorName: o.sectorName || '',
              fullAddress: o.formattedAddress || o.street || '',
              reference: o.reference || '',
              coordinates: {
                lat: o.latitude || 18.4795,
                lng: o.longitude || -69.9326
              }
            },
            amountCollected: Number(o.amountCollected ?? o.collectedAmount ?? 0),
            fulfillment: {
              required: o.requiresFulfillment || false
            },
            financials: {
              orderCollectionAmount: financials.totalCollected,
              shippingCost: financials.shippingCost,
              courierCommission: 100, // Comisión simulada
              storeProductAmount: financials.netStoreAmount,
            }
          };
        });
        setOrders(firestoreOrders as any);
      }, (error) => {
        console.error("Error listening to courier orders in page:", error);
      });

      return () => unsubscribe();
    } else {
      setOrders([]);
    }
  }, [profile]);

  const myOrders = orders.filter((order) => ASSIGNED_ORDER_STATUSES.has(order.status));
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

  const downloadLabelPdf = async (orderIds: string[]) => {
    if (!user || !orderIds.length) return;
    try {
      await downloadOrdersPdf(user, orderIds, 'labels');
    } catch (error) {
      console.error(error);
      alert('No se pudo generar el PDF de etiquetas.');
    }
  };

  return (
    <div className="space-y-5 max-w-2xl mx-auto lg:max-w-full">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">Pedidos asignados</h2>
          <p className="text-sm text-slate-400 mt-0.5">{myOrders.length} pedidos en tu lista hoy</p>
        </div>
        {selectedIds.size > 0 && (
          <div className="flex gap-2">
            <button onClick={printSelected} className="flex items-center gap-2 bg-slate-900 text-white text-xs font-bold px-3 py-2.5 rounded-xl">
              <Printer size={14} /> Imprimir
            </button>
            <button onClick={() => void downloadLabelPdf(Array.from(selectedIds))} className="flex items-center gap-2 bg-[#d3121a] text-white text-xs font-bold px-3 py-2.5 rounded-xl">
              <Download size={14} /> PDF
            </button>
          </div>
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
            <p className="font-bold text-slate-500">No hay pedidos registrados</p>
          </div>
        )}
        {filtered.map((order) => {
          const st = STATUS_CONFIG[order.status];
          const isSelected = selectedIds.has(order.id);
          const template = DEFAULT_WHATSAPP_TEMPLATES[templateKey];
          const waUrl = buildWhatsAppUrl(
            order.customer.phone,
            template.template,
            { motorista: profile?.fullName || 'Motorista', tienda: order.storeName, tracking: order.trackingId }
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

              <div className="mb-3 grid grid-cols-1 gap-1 rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs">
                <div><span className="font-bold text-slate-500">Producto:</span> <span className="font-semibold text-slate-800">{order.productName}</span></div>
                <div><span className="font-bold text-slate-500">Tienda:</span> <span className="font-semibold text-slate-800">{order.storeName}</span></div>
              </div>

              {/* Financial & Fulfillment badges */}
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="text-xs font-extrabold bg-[#fee2e2] text-[#d3121a] px-2.5 py-1 rounded-full">
                  RD${Number(order.financials.orderCollectionAmount || 0).toLocaleString()}
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
              <div className="grid grid-cols-4 gap-2">
                <a
                  href={`tel:${order.customer.phone}`}
                  className="flex items-center justify-center gap-1.5 py-2.5 bg-slate-50 hover:bg-slate-100 border border-[#E7E7EC] rounded-xl text-xs font-bold text-slate-700 transition-all"
                >
                  <Phone size={13} /> Llamar
                </a>
                <WhatsAppContactButton
                  phone={order.customer.phone}
                  orderId={order.id}
                  customerName={order.customer.name}
                  storeName={order.storeName || 'Tienda'}
                  trackingId={order.trackingId || order.id}
                  templateKey={(['in_transit', 'close', 'arrived', 'no_contact', 'rescheduled'] as const)[templateKey] || 'in_transit'}
                />
                <button
                  onClick={() => printLabel(order)}
                  className="flex items-center justify-center gap-1.5 py-2.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl text-xs font-bold text-blue-700 transition-all"
                >
                  <Printer size={13} /> Label
                </button>
                <button
                  onClick={() => void downloadLabelPdf([order.id])}
                  className="flex items-center justify-center gap-1.5 py-2.5 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl text-xs font-bold text-red-700 transition-all"
                >
                  <Download size={13} /> PDF
                </button>
              </div>

              {/* View order detail link */}
              <div className="mt-2">
                <Link
                  href={`/motorista/pedidos/${order.id}`}
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-slate-100 hover:bg-slate-200 border border-[#E7E7EC] rounded-xl text-xs font-extrabold text-slate-700 transition-all"
                >
                  Ver detalle operativo →
                </Link>
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
