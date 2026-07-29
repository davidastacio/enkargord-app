"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Calendar,
  CheckCircle2,
  DollarSign,
  MapPin,
  Search,
  Store,
  Truck,
  User,
} from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import { getOrderFinancials } from "@/lib/orders/financials";
import { subscribeSupabaseOrders } from "@/lib/supabase/orders";
import { listSupabaseStoreNames } from "@/lib/supabase/stores";

type DeliveredOrder = {
  id: string;
  tracking?: string;
  status?: string;
  storeId?: string;
  storeName?: string;
  customerName?: string;
  customerPhone?: string;
  courierName?: string;
  formattedAddress?: string;
  street?: string;
  sectorName?: string;
  municipalityName?: string;
  provinceName?: string;
  receiverName?: string;
  deliveryNote?: string;
  deliveredAt?: string;
  updatedAt?: string;
  createdAt?: string;
  collectionAmount?: number;
  amountCollected?: number;
  collectedAmount?: number;
  shippingCost?: number;
};

export default function DeliveredOrdersModule() {
  const { profile } = useAuth() as { profile?: { uid?: string } };
  const [orders, setOrders] = useState<DeliveredOrder[]>([]);
  const [storeNames, setStoreNames] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile?.uid) return;
    void listSupabaseStoreNames().then(setStoreNames).catch(console.error);

    return subscribeSupabaseOrders(
      {},
      (records) => {
        setError(null);
        setOrders(
          records
            .filter((order) => order.status === "delivered")
            .sort((a, b) =>
              String(b.deliveredAt || b.updatedAt).localeCompare(
                String(a.deliveredAt || a.updatedAt),
              ),
            ) as unknown as DeliveredOrder[],
        );
        setLoading(false);
      },
      (subscriptionError) => {
        console.error("Error loading delivered orders:", subscriptionError);
        setError("No pudimos cargar los pedidos entregados.");
        setLoading(false);
      },
    );
  }, [profile?.uid]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return orders;
    return orders.filter((order) =>
      [
        order.id,
        order.tracking,
        order.customerName,
        order.customerPhone,
        order.courierName,
        order.storeName,
        storeNames[order.storeId || ""],
        order.formattedAddress,
      ].some((value) => String(value || "").toLowerCase().includes(query)),
    );
  }, [orders, search, storeNames]);

  const totalCollected = orders.reduce(
    (sum, order) => sum + getOrderFinancials(order as Record<string, unknown>).totalCollected,
    0,
  );

  const formatDate = (order: DeliveredOrder) => {
    const value = order.deliveredAt || order.updatedAt || order.createdAt;
    if (!value) return "Fecha no disponible";
    return new Date(value).toLocaleString("es-DO", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="mb-2 flex items-center gap-2 text-emerald-600">
          <CheckCircle2 size={19} />
          <span className="text-[10px] font-extrabold uppercase tracking-[0.18em]">
            Historial operativo
          </span>
        </div>
        <h1 className="text-2xl font-extrabold text-slate-950">Pedidos entregados</h1>
        <p className="mt-1 text-sm text-slate-500">
          Consulta todas las entregas completadas por tiendas y motoristas.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600">
            Entregas registradas
          </p>
          <p className="mt-1 text-3xl font-extrabold text-emerald-800">{orders.length}</p>
        </div>
        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600">
            Total recaudado
          </p>
          <p className="mt-1 text-3xl font-extrabold text-blue-800">
            RD${totalCollected.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar por tracking, cliente, tienda o motorista..."
          className="w-full rounded-2xl border border-[#E7E7EC] bg-white py-3 pl-11 pr-4 text-sm font-semibold outline-none focus:border-emerald-300"
        />
      </div>

      {loading ? (
        <div className="rounded-2xl border border-[#E7E7EC] bg-white p-12 text-center text-sm font-semibold text-slate-400">
          Cargando pedidos entregados...
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm font-bold text-red-700">
          {error}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-[#E7E7EC] bg-white p-12 text-center text-sm font-semibold text-slate-400">
          No hay pedidos entregados que coincidan.
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {filtered.map((order) => {
            const financials = getOrderFinancials(order as Record<string, unknown>);
            const address =
              order.formattedAddress ||
              order.street ||
              [order.sectorName, order.municipalityName, order.provinceName]
                .filter(Boolean)
                .join(", ");
            return (
              <article
                key={order.id}
                className="rounded-2xl border border-[#E7E7EC] bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-extrabold text-slate-900">
                      #{order.tracking || order.id}
                    </p>
                    <h2 className="mt-1 text-lg font-extrabold text-slate-800">
                      {order.customerName || "Cliente"}
                    </h2>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-extrabold text-emerald-700">
                    Entregado
                  </span>
                </div>

                <div className="mt-4 grid gap-2 text-xs text-slate-500 sm:grid-cols-2">
                  <div className="flex items-center gap-2">
                    <Store size={14} />
                    <span className="font-semibold">
                      {storeNames[order.storeId || ""] || order.storeName || "Tienda"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Truck size={14} />
                    <span className="font-semibold">{order.courierName || "Motorista"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar size={14} />
                    <span>{formatDate(order)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign size={14} />
                    <span className="font-extrabold text-slate-700">
                      RD${financials.totalCollected.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 sm:col-span-2">
                    <MapPin size={14} className="shrink-0" />
                    <span className="truncate">{address || "Dirección no disponible"}</span>
                  </div>
                  {order.receiverName && (
                    <div className="flex items-center gap-2 sm:col-span-2">
                      <User size={14} />
                      <span>Recibido por: {order.receiverName}</span>
                    </div>
                  )}
                </div>

                {order.deliveryNote && (
                  <div className="mt-4 rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
                    <span className="font-extrabold">Nota de entrega:</span>{" "}
                    {order.deliveryNote}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
