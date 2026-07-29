"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Calendar,
  MapPin,
  MessageSquareText,
  Search,
  Store,
  Truck,
  User,
} from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import { subscribeSupabaseOrders } from "@/lib/supabase/orders";
import { listSupabaseStoreNames } from "@/lib/supabase/stores";

const UNDELIVERED_STATUSES = new Set([
  "customer_unreachable",
  "no_answer",
  "failed",
  "failed_delivery",
  "returned",
]);

const STATUS_LABELS: Record<string, string> = {
  customer_unreachable: "Cliente no contesta",
  no_answer: "Cliente no contesta",
  failed: "Entrega fallida",
  failed_delivery: "Entrega fallida",
  returned: "Devuelto",
};

type UndeliveredOrder = {
  id: string;
  tracking?: string;
  status: string;
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
  unreachableNote?: string;
  failureReason?: string;
  failedDeliveryNote?: string;
  returnNote?: string;
  lastContactAttemptAt?: string;
  updatedAt?: string;
  createdAt?: string;
};

export default function UndeliveredOrdersModule({
  scope,
}: {
  scope: "store" | "admin";
}) {
  const { profile } = useAuth() as {
    profile?: { uid?: string; storeId?: string };
  };
  const [orders, setOrders] = useState<UndeliveredOrder[]>([]);
  const [storeNames, setStoreNames] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile?.uid) return;
    const storeId = scope === "store" ? profile.storeId || profile.uid : undefined;
    if (scope === "admin") {
      void listSupabaseStoreNames().then(setStoreNames).catch(console.error);
    }

    return subscribeSupabaseOrders(
      storeId ? { storeId } : {},
      (records) => {
        setError(null);
        setOrders(
          records
            .filter((order) => UNDELIVERED_STATUSES.has(String(order.status)))
            .sort((a, b) =>
              String(b.lastContactAttemptAt || b.updatedAt || b.createdAt).localeCompare(
                String(a.lastContactAttemptAt || a.updatedAt || a.createdAt),
              ),
            ) as unknown as UndeliveredOrder[],
        );
        setLoading(false);
      },
      (subscriptionError) => {
        console.error("Error loading undelivered orders:", subscriptionError);
        setError("No pudimos cargar los pedidos no entregados.");
        setLoading(false);
      },
    );
  }, [profile?.storeId, profile?.uid, scope]);

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
        order.formattedAddress,
        order.street,
        storeNames[order.storeId || ""],
      ].some((value) => String(value || "").toLowerCase().includes(query)),
    );
  }, [orders, search, storeNames]);

  const formatDate = (order: UndeliveredOrder) => {
    const value = order.lastContactAttemptAt || order.updatedAt || order.createdAt;
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-red-600">
            <AlertTriangle size={18} />
            <span className="text-[10px] font-extrabold uppercase tracking-[0.18em]">
              Incidencias de entrega
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-950">Pedidos no entregados</h1>
          <p className="mt-1 text-sm text-slate-500">
            {scope === "admin"
              ? "Consulta los reportes enviados por todos los motoristas."
              : "Revisa por qué el motorista no pudo completar cada entrega."}
          </p>
        </div>
        <div className="rounded-2xl border border-red-100 bg-red-50 px-5 py-3">
          <span className="text-2xl font-extrabold text-red-700">{orders.length}</span>
          <span className="ml-2 text-xs font-bold text-red-600">reportados</span>
        </div>
      </div>

      <div className="relative">
        <Search
          size={16}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar por tracking, cliente, tienda o motorista..."
          className="w-full rounded-2xl border border-[#E7E7EC] bg-white py-3 pl-11 pr-4 text-sm font-semibold outline-none transition-colors focus:border-red-300"
        />
      </div>

      {loading ? (
        <div className="rounded-2xl border border-[#E7E7EC] bg-white p-12 text-center text-sm font-semibold text-slate-400">
          Cargando reportes...
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm font-bold text-red-700">
          {error}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-[#E7E7EC] bg-white p-12 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
            <Truck size={22} />
          </div>
          <p className="font-extrabold text-slate-700">No hay pedidos no entregados</p>
          <p className="mt-1 text-sm text-slate-400">
            Los reportes del motorista aparecerán aquí.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {filtered.map((order) => {
            const note =
              String(
                order.unreachableNote ||
                  order.failureReason ||
                  order.failedDeliveryNote ||
                  order.returnNote ||
                  "",
              ).trim() || "El motorista no adjuntó una nota.";
            const address =
              order.formattedAddress ||
              order.street ||
              [order.sectorName, order.municipalityName, order.provinceName]
                .filter(Boolean)
                .join(", ");
            const content = (
              <article className="h-full rounded-2xl border border-[#E7E7EC] bg-white p-5 shadow-sm transition-all hover:border-red-200 hover:shadow-md">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-extrabold text-slate-900">
                      #{order.tracking || order.id}
                    </p>
                    <p className="mt-1 text-lg font-extrabold text-slate-800">
                      {order.customerName || "Cliente"}
                    </p>
                  </div>
                  <span className="rounded-full bg-red-50 px-3 py-1 text-[10px] font-extrabold text-red-700">
                    {STATUS_LABELS[order.status] || "No entregado"}
                  </span>
                </div>

                <div className="mt-4 rounded-xl border border-red-100 bg-red-50/70 p-4">
                  <div className="mb-2 flex items-center gap-2 text-red-700">
                    <MessageSquareText size={15} />
                    <span className="text-[10px] font-extrabold uppercase tracking-wider">
                      Nota del motorista
                    </span>
                  </div>
                  <p className="whitespace-pre-wrap text-sm font-semibold leading-relaxed text-slate-700">
                    {note}
                  </p>
                </div>

                <div className="mt-4 grid gap-2 text-xs text-slate-500 sm:grid-cols-2">
                  {scope === "admin" && (
                    <div className="flex items-center gap-2">
                      <Store size={14} className="text-slate-400" />
                      <span className="font-semibold">
                        {storeNames[order.storeId || ""] || order.storeName || "Tienda"}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <User size={14} className="text-slate-400" />
                    <span className="font-semibold">{order.courierName || "Motorista"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-slate-400" />
                    <span>{formatDate(order)}</span>
                  </div>
                  <div className="flex items-center gap-2 sm:col-span-2">
                    <MapPin size={14} className="shrink-0 text-slate-400" />
                    <span className="truncate">{address || "Dirección no disponible"}</span>
                  </div>
                </div>
              </article>
            );

            return scope === "store" ? (
              <Link key={order.id} href={`/tienda/pedidos/${order.id}`}>
                {content}
              </Link>
            ) : (
              <div key={order.id}>{content}</div>
            );
          })}
        </div>
      )}
    </div>
  );
}
