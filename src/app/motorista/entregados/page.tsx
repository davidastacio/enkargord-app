"use client";

import { useState, useEffect } from 'react';
import {
  CheckCircle,
  DollarSign,
  MapPin,
  Clock,
  CreditCard,
  Smartphone,
  Banknote,
  SplitSquareVertical,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  Building2,
  User,
} from 'lucide-react';
import { DEFAULT_ORDERS, DEFAULT_PRICING, type CourierOrder, type PaymentMethod } from '@/data/courier';

const PAYMENT_METHODS: { key: PaymentMethod; label: string; icon: React.ElementType }[] = [
  { key: 'cash',     label: 'Efectivo',        icon: Banknote },
  { key: 'card',     label: 'Tarjeta',         icon: CreditCard },
  { key: 'transfer', label: 'Transferencia',   icon: Smartphone },
  { key: 'mixed',    label: 'Mixto',           icon: SplitSquareVertical },
];

export default function EntregadosPage() {
  const [orders, setOrders] = useState<CourierOrder[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [pricing, setPricing] = useState(DEFAULT_PRICING);

  useEffect(() => {
    const stored = localStorage.getItem('enkargord_courier_orders');
    setOrders(stored ? JSON.parse(stored) : DEFAULT_ORDERS);
    const storedPricing = localStorage.getItem('enkargord_pricing');
    if (storedPricing) setPricing(JSON.parse(storedPricing));
  }, []);

  const saveOrders = (updated: CourierOrder[]) => {
    setOrders(updated);
    localStorage.setItem('enkargord_courier_orders', JSON.stringify(updated));
  };

  const deliveredOrders = orders.filter(
    (o) => o.courierId === 'COU-001' && o.status === 'delivered'
  );

  const totalCollected    = deliveredOrders.reduce((s, o) => s + (o.amountCollected ?? 0), 0);
  const totalForStores    = deliveredOrders.reduce((s, o) => s + o.financials.storeProductAmount, 0);
  const totalCommission   = deliveredOrders.reduce((s, o) => s + o.financials.courierCommission, 0);
  const totalBeneficiary  = deliveredOrders.reduce((s, o) => s + o.financials.transportCompanyAmount, 0);
  const totalToDeliver    = totalCollected - totalCommission;

  const setPaymentMethod = (orderId: string, method: PaymentMethod) => {
    const updated = orders.map((o) =>
      o.id === orderId ? { ...o, paymentMethod: method } : o
    );
    saveOrders(updated);
  };

  return (
    <div className="space-y-5 max-w-2xl mx-auto lg:max-w-full">

      {/* Header */}
      <div>
        <h2 className="text-xl font-extrabold text-slate-900">Pedidos entregados</h2>
        <p className="text-sm text-slate-400 mt-0.5">{deliveredOrders.length} entrega{deliveredOrders.length !== 1 ? 's' : ''} completadas hoy</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white border border-[#E7E7EC] rounded-2xl p-4 shadow-sm col-span-2">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total recaudado</div>
          <div className="text-3xl font-extrabold text-slate-900">RD${totalCollected.toLocaleString()}</div>
          <div className="mt-3 h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full" style={{ width: '100%' }} />
          </div>
        </div>
        <div className="bg-white border border-[#E7E7EC] rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Building2 size={13} className="text-blue-500" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Para tiendas</span>
          </div>
          <div className="text-xl font-extrabold text-slate-900">RD${totalForStores.toLocaleString()}</div>
        </div>
        <div className="bg-white border border-[#E7E7EC] rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp size={13} className="text-violet-500" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mi comisión</span>
          </div>
          <div className="text-xl font-extrabold text-violet-700">RD${totalCommission.toLocaleString()}</div>
        </div>
        <div className="bg-white border border-[#E7E7EC] rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <User size={13} className="text-amber-500" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Beneficiarios</span>
          </div>
          <div className="text-xl font-extrabold text-amber-700">RD${totalBeneficiary.toLocaleString()}</div>
        </div>
        <div className="bg-[#fee2e2] border border-red-200 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign size={13} className="text-[#d3121a]" />
            <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest">A entregar</span>
          </div>
          <div className="text-xl font-extrabold text-[#d3121a]">RD${totalToDeliver.toLocaleString()}</div>
        </div>
      </div>

      {/* Delivered Order List */}
      <div className="space-y-3">
        {deliveredOrders.length === 0 && (
          <div className="bg-white border border-[#E7E7EC] rounded-2xl p-10 text-center">
            <CheckCircle size={40} className="text-slate-300 mx-auto mb-3" />
            <p className="font-bold text-slate-500">Aún no hay entregas completadas</p>
          </div>
        )}
        {deliveredOrders.map((order) => {
          const isExpanded = expandedId === order.id;
          const fin = order.financials;

          return (
            <div key={order.id} className="bg-white border border-[#E7E7EC] rounded-2xl shadow-sm overflow-hidden">
              {/* Card Header */}
              <button
                className="w-full flex items-center gap-3 p-4 text-left hover:bg-slate-50 transition-all"
                onClick={() => setExpandedId(isExpanded ? null : order.id)}
              >
                <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <CheckCircle size={17} className="text-emerald-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-extrabold text-sm text-slate-800 truncate">{order.customer.name}</div>
                  <div className="text-[10px] text-slate-400 font-mono">{order.trackingId}</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="font-extrabold text-sm text-emerald-700">
                    RD${(order.amountCollected ?? 0).toLocaleString()}
                  </div>
                  {order.deliveredAt && (
                    <div className="text-[10px] text-slate-400">
                      {new Date(order.deliveredAt).toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  )}
                </div>
                {isExpanded ? <ChevronUp size={16} className="text-slate-400 flex-shrink-0" /> : <ChevronDown size={16} className="text-slate-400 flex-shrink-0" />}
              </button>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="border-t border-[#E7E7EC] p-4 space-y-4">
                  {/* Address */}
                  <div className="flex items-start gap-2 text-xs text-slate-600">
                    <MapPin size={13} className="flex-shrink-0 text-slate-400 mt-0.5" />
                    {order.deliveryAddress.fullAddress}
                  </div>

                  {/* Delivery time */}
                  {order.deliveredAt && (
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Clock size={13} className="text-slate-400" />
                      Entregado: {new Date(order.deliveredAt).toLocaleString('es-DO')}
                    </div>
                  )}

                  {/* Payment method selector */}
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Método de pago</p>
                    <div className="grid grid-cols-4 gap-1.5">
                      {PAYMENT_METHODS.map(({ key, label, icon: Icon }) => (
                        <button
                          key={key}
                          onClick={() => setPaymentMethod(order.id, key)}
                          className={`flex flex-col items-center gap-1 py-2 px-1 rounded-xl border text-[9px] font-bold transition-all ${
                            order.paymentMethod === key
                              ? 'bg-[#d3121a] text-white border-[#d3121a]'
                              : 'bg-slate-50 text-slate-500 border-[#E7E7EC] hover:border-slate-300'
                          }`}
                        >
                          <Icon size={14} />
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Financial breakdown */}
                  <div className="bg-slate-50 rounded-xl p-3 space-y-2">
                    <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-2">Distribución financiera</p>
                    {[
                      { label: 'Total cobrado',     value: fin.orderCollectionAmount, color: 'text-slate-800 font-extrabold' },
                      { label: 'Para la tienda',    value: fin.storeProductAmount,    color: 'text-blue-700' },
                      { label: 'Mi comisión',        value: fin.courierCommission,     color: 'text-violet-700' },
                      ...fin.beneficiaryBreakdown.map((b) => ({ label: b.name, value: b.amount, color: 'text-amber-700' })),
                      { label: 'Fulfillment',       value: fin.fulfillmentCost,       color: 'text-slate-600' },
                    ].map((row) => row.value > 0 && (
                      <div key={row.label} className="flex items-center justify-between text-xs">
                        <span className="text-slate-500 font-medium">{row.label}</span>
                        <span className={`font-bold ${row.color}`}>RD${row.value.toLocaleString()}</span>
                      </div>
                    ))}
                    <div className="border-t border-slate-200 pt-2 flex items-center justify-between text-xs">
                      <span className="text-slate-700 font-bold">A entregar a empresa</span>
                      <span className="font-extrabold text-[#d3121a]">
                        RD${(fin.orderCollectionAmount - fin.courierCommission).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
