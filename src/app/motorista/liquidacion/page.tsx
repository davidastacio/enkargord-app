"use client";

import { useState, useEffect } from 'react';
import {
  DollarSign,
  CheckCircle,
  Clock,
  TrendingUp,
  Building2,
  User,
  FileText,
  Send,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Download,
} from 'lucide-react';
import { DEFAULT_ORDERS, DEFAULT_PRICING, type CourierOrder, type Liquidation, type LiquidationEntry } from '@/data/courier';

type LiqStatus = 'idle' | 'submitted' | 'approved' | 'paid';

export default function LiquidacionPage() {
  const [orders, setOrders] = useState<CourierOrder[]>([]);
  const [liquidations, setLiquidations] = useState<Liquidation[]>([]);
  const [currentStatus, setCurrentStatus] = useState<LiqStatus>('idle');
  const [expandedLiq, setExpandedLiq] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('enkargord_courier_orders');
    setOrders(stored ? JSON.parse(stored) : DEFAULT_ORDERS);
    const storedLiq = localStorage.getItem('enkargord_liquidations');
    if (storedLiq) setLiquidations(JSON.parse(storedLiq));
  }, []);

  const triggerToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  // Orders ready to be liquidated (delivered, not yet settled)
  const pendingOrders = orders.filter(
    (o) => o.courierId === 'COU-001' && o.status === 'delivered'
  );

  // Financial aggregates for pending liquidation
  const totalCollected   = pendingOrders.reduce((s, o) => s + (o.amountCollected ?? 0), 0);
  const totalForStores   = pendingOrders.reduce((s, o) => s + o.financials.storeProductAmount, 0);
  const totalCommission  = pendingOrders.reduce((s, o) => s + o.financials.courierCommission, 0);
  const totalBeneficiary = pendingOrders.reduce((s, o) => s + o.financials.transportCompanyAmount, 0);
  const totalFulfillment = pendingOrders.reduce((s, o) => s + o.financials.fulfillmentCost, 0);
  const totalCashToDeliver = totalCollected - totalCommission;

  const buildEntries = (): LiquidationEntry[] =>
    pendingOrders.map((o) => ({
      orderId: o.id,
      trackingId: o.trackingId,
      storeName: o.storeName,
      amountCollected: o.amountCollected ?? 0,
      storeAmount: o.financials.storeProductAmount,
      courierCommission: o.financials.courierCommission,
      beneficiaryAmounts: o.financials.beneficiaryBreakdown,
      shippingCost: o.financials.shippingCost,
      fulfillmentCost: o.financials.fulfillmentCost,
      deliveredAt: o.deliveredAt ?? new Date().toISOString(),
    }));

  const handleSubmit = () => {
    if (pendingOrders.length === 0) {
      triggerToast('No hay entregas pendientes de liquidar.');
      return;
    }

    const newLiq: Liquidation = {
      id: `LIQ-${Date.now()}`,
      courierId: 'COU-001',
      courierName: 'Carlos Martínez',
      status: 'submitted',
      submittedAt: new Date().toISOString(),
      entries: buildEntries(),
      totalCollected,
      totalForStores,
      totalCourierCommission: totalCommission,
      totalBeneficiaryAmounts: totalBeneficiary,
      totalForCompany: totalBeneficiary + totalFulfillment,
      totalCashToDeliver,
    };

    const updatedLiqs = [newLiq, ...liquidations];
    setLiquidations(updatedLiqs);
    localStorage.setItem('enkargord_liquidations', JSON.stringify(updatedLiqs));

    // Mark orders as settled
    const updatedOrders = orders.map((o) =>
      o.courierId === 'COU-001' && o.status === 'delivered'
        ? { ...o, status: 'settled' as const }
        : o
    );
    setOrders(updatedOrders);
    localStorage.setItem('enkargord_courier_orders', JSON.stringify(updatedOrders));

    setCurrentStatus('submitted');
    triggerToast('✅ Solicitud de liquidación enviada correctamente.');
  };

  const printReceipt = (liq: Liquidation) => {
    const win = window.open('', '_blank', 'width=500,height=700');
    if (!win) return;
    win.document.write(`
      <!DOCTYPE html><html><head><title>Liquidación ${liq.id}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; font-size: 12px; }
        h1 { color: #d3121a; font-size: 18px; margin: 0 0 4px; }
        .sub { color: #64748b; font-size: 10px; margin-bottom: 16px; }
        table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 11px; }
        th { background: #f8fafc; padding: 6px; text-align: left; color: #64748b; font-size: 9px; text-transform: uppercase; }
        td { padding: 6px; border-bottom: 1px solid #e2e8f0; }
        .total { font-weight: 900; font-size: 14px; color: #d3121a; }
        .footer { text-align: center; font-size: 9px; color: #94a3b8; margin-top: 16px; }
      </style></head><body>
      <h1>EnkargoRD</h1>
      <div class="sub">Comprobante de Liquidación · ${liq.id}</div>
      <p><strong>Motorista:</strong> ${liq.courierName}</p>
      <p><strong>Fecha:</strong> ${new Date(liq.submittedAt!).toLocaleString('es-DO')}</p>
      <table>
        <tr><th>Tracking</th><th>Tienda</th><th>Cobrado</th><th>Comisión</th></tr>
        ${liq.entries.map((e) => `<tr><td>${e.trackingId}</td><td>${e.storeName}</td><td>RD$${e.amountCollected.toLocaleString()}</td><td>RD$${e.courierCommission.toLocaleString()}</td></tr>`).join('')}
      </table>
      <p>Total cobrado: <strong>RD$${liq.totalCollected.toLocaleString()}</strong></p>
      <p>Mi comisión: <strong>RD$${liq.totalCourierCommission.toLocaleString()}</strong></p>
      <p class="total">A entregar: RD$${liq.totalCashToDeliver.toLocaleString()}</p>
      <div class="footer">Generado por EnkargoRD</div>
      </body></html>
    `);
    win.document.close();
    win.print();
  };

  return (
    <div className="space-y-5 max-w-2xl mx-auto lg:max-w-full">

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-20 left-4 right-4 lg:left-auto lg:right-6 lg:w-96 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-3">
          <div className="w-2 h-2 bg-emerald-500 rounded-full" />
          <span className="text-sm font-medium">{toast}</span>
        </div>
      )}

      {/* Header */}
      <div>
        <h2 className="text-xl font-extrabold text-slate-900">Liquidación</h2>
        <p className="text-sm text-slate-400 mt-0.5">{pendingOrders.length} entrega{pendingOrders.length !== 1 ? 's' : ''} pendiente{pendingOrders.length !== 1 ? 's' : ''} de liquidar</p>
      </div>

      {/* Status banner */}
      {currentStatus === 'submitted' && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3">
          <Clock size={18} className="text-amber-600 flex-shrink-0" />
          <div>
            <div className="font-bold text-amber-800 text-sm">Solicitud enviada</div>
            <div className="text-xs text-amber-600 mt-0.5">En espera de aprobación del administrador.</div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white border border-[#E7E7EC] rounded-2xl p-4 shadow-sm col-span-2">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total recaudado (pendiente liquidar)</div>
          <div className="text-3xl font-extrabold text-slate-900 mt-1">RD${totalCollected.toLocaleString()}</div>
        </div>
        {[
          { label: 'Para tiendas',      value: totalForStores,    icon: Building2, color: 'text-blue-700',    bg: 'bg-blue-50' },
          { label: 'Mi comisión',       value: totalCommission,   icon: TrendingUp,color: 'text-violet-700',  bg: 'bg-violet-50' },
          { label: 'Beneficiarios',     value: totalBeneficiary,  icon: User,      color: 'text-amber-700',   bg: 'bg-amber-50' },
          { label: 'Fulfillment',       value: totalFulfillment,  icon: FileText,  color: 'text-slate-600',   bg: 'bg-slate-50' },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="bg-white border border-[#E7E7EC] rounded-2xl p-4 shadow-sm">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center mb-2 ${item.bg}`}>
                <Icon size={15} className={item.color} />
              </div>
              <div className={`text-lg font-extrabold ${item.color}`}>RD${item.value.toLocaleString()}</div>
              <div className="text-[10px] text-slate-400 font-semibold mt-0.5">{item.label}</div>
            </div>
          );
        })}
        <div className="bg-[#fee2e2] border border-red-200 rounded-2xl p-4 shadow-sm col-span-2 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold text-red-400 uppercase tracking-widest">Efectivo a entregar a empresa</div>
            <div className="text-2xl font-extrabold text-[#d3121a] mt-1">RD${totalCashToDeliver.toLocaleString()}</div>
          </div>
          <DollarSign size={28} className="text-[#d3121a] opacity-30" />
        </div>
      </div>

      {/* Order Detail Table */}
      {pendingOrders.length > 0 && (
        <div className="bg-white border border-[#E7E7EC] rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-[#E7E7EC]">
            <h3 className="font-extrabold text-slate-800 text-sm">Detalle de entregas</h3>
          </div>
          <div className="divide-y divide-[#E7E7EC]">
            {pendingOrders.map((order) => (
              <div key={order.id} className="px-4 py-3 flex items-center gap-3">
                <div className="w-8 h-8 bg-emerald-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <CheckCircle size={14} className="text-emerald-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-xs text-slate-700 truncate">{order.customer.name}</div>
                  <div className="text-[10px] text-slate-400 font-mono">{order.trackingId} · {order.storeName}</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-xs font-extrabold text-slate-800">RD${(order.amountCollected ?? 0).toLocaleString()}</div>
                  <div className="text-[9px] text-violet-600 font-bold">Com. RD${order.financials.courierCommission.toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        disabled={pendingOrders.length === 0 || currentStatus === 'submitted'}
        className="w-full flex items-center justify-center gap-2 py-4 bg-[#d3121a] hover:bg-[#b00f14] disabled:opacity-40 text-white rounded-2xl font-extrabold text-base shadow-md shadow-red-100 transition-all active:scale-95"
      >
        <Send size={18} />
        Solicitar liquidación ({pendingOrders.length} entregas)
      </button>

      {/* History */}
      {liquidations.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-extrabold text-slate-800">Historial de liquidaciones</h3>
          {liquidations.map((liq) => {
            const isExpanded = expandedLiq === liq.id;
            const statusColors: Record<string, string> = {
              submitted: 'bg-amber-50 text-amber-700',
              approved:  'bg-emerald-50 text-emerald-700',
              rejected:  'bg-red-50 text-red-700',
              paid:      'bg-blue-50 text-blue-700',
              pending:   'bg-slate-100 text-slate-600',
            };
            const statusLabels: Record<string, string> = {
              submitted: 'Enviada',
              approved:  'Aprobada',
              rejected:  'Rechazada',
              paid:      'Pagada',
              pending:   'Pendiente',
            };

            return (
              <div key={liq.id} className="bg-white border border-[#E7E7EC] rounded-2xl shadow-sm overflow-hidden">
                <button
                  className="w-full flex items-center gap-3 p-4 text-left hover:bg-slate-50 transition-all"
                  onClick={() => setExpandedLiq(isExpanded ? null : liq.id)}
                >
                  <div className="w-9 h-9 bg-violet-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <DollarSign size={17} className="text-violet-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-extrabold text-sm text-slate-800">{liq.id}</div>
                    <div className="text-[10px] text-slate-400">{new Date(liq.submittedAt!).toLocaleString('es-DO')}</div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="font-extrabold text-sm text-slate-700">
                      RD${liq.totalCollected.toLocaleString()}
                    </span>
                    <span className={`text-[10px] font-extrabold px-2 py-1 rounded-full ${statusColors[liq.status] ?? ''}`}>
                      {statusLabels[liq.status] ?? liq.status}
                    </span>
                    {isExpanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-[#E7E7EC] p-4 space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-slate-50 rounded-xl p-3">
                        <div className="text-slate-400 font-semibold mb-1">Entregas</div>
                        <div className="font-extrabold text-slate-800">{liq.entries.length}</div>
                      </div>
                      <div className="bg-violet-50 rounded-xl p-3">
                        <div className="text-violet-400 font-semibold mb-1">Mi comisión</div>
                        <div className="font-extrabold text-violet-700">RD${liq.totalCourierCommission.toLocaleString()}</div>
                      </div>
                      <div className="bg-[#fee2e2] rounded-xl p-3 col-span-2">
                        <div className="text-red-400 font-semibold mb-1">Efectivo entregado</div>
                        <div className="font-extrabold text-[#d3121a] text-lg">RD${liq.totalCashToDeliver.toLocaleString()}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => printReceipt(liq)}
                      className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-50 hover:bg-slate-100 border border-[#E7E7EC] rounded-xl text-sm font-bold text-slate-600"
                    >
                      <Download size={14} /> Descargar comprobante
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
