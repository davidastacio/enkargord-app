"use client";

import type { RealtimeChannel } from "@supabase/supabase-js";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export type EnkargoOrder = Record<string, unknown> & {
  id: string;
  tracking: string;
  createdAt: string;
  updatedAt: string;
};

type OrderFilters = {
  storeId?: string;
  courierId?: string;
};

type SupabaseOrderRow = {
  id: string;
  tracking: string;
  organization_id: string;
  store_id: string | null;
  created_by_uid: string;
  courier_id: string | null;
  courier_uid: string | null;
  courier_name: string;
  courier_type: string;
  status: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  province_name: string;
  municipality_name: string;
  sector_name: string;
  street: string;
  reference: string;
  formatted_address: string;
  location_verified: boolean;
  package_type: string;
  package_quantity: number;
  package_description: string;
  requires_cash_on_delivery: boolean;
  collection_amount: number;
  shipping_cost: number;
  payment_method: string;
  requires_fulfillment: boolean;
  fulfillment_data: Record<string, unknown> | null;
  route_order: number | null;
  settlement_status: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  delivered_at: string | null;
};

export type SupabaseOrderEvent = {
  id: string;
  type: string;
  previousStatus: string;
  newStatus: string;
  actorRole: string;
  note: string;
  createdAt: string;
} & Record<string, unknown>;

function text(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function nullableText(value: unknown): string | null {
  const normalized = text(value);
  return normalized || null;
}

function numberValue(value: unknown, fallback = 0): number {
  const parsed = typeof value === "number" ? value : parseFloat(text(value));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function sanitize(value: unknown): unknown {
  if (value === undefined) return null;
  if (Array.isArray(value)) return value.map(sanitize);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, child]) => [key, sanitize(child)]),
    );
  }
  return value;
}

function fromRow(row: SupabaseOrderRow): EnkargoOrder {
  const metadata = row.metadata || {};
  const collectedAmount = numberValue(
    metadata.amountCollected ?? metadata.collectedAmount,
    row.status === "delivered" ? Number(row.collection_amount) : 0,
  );

  return {
    ...metadata,
    id: row.id,
    tracking: row.tracking,
    storeId: row.store_id,
    createdByUid: row.created_by_uid,
    courierId: row.courier_id,
    courierUid: row.courier_uid,
    courierName: row.courier_name || null,
    courierType: row.courier_type,
    status: row.status,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    customerEmail: row.customer_email || null,
    provinceName: row.province_name,
    municipalityName: row.municipality_name,
    sectorName: row.sector_name,
    street: row.street,
    reference: row.reference || null,
    formattedAddress: row.formatted_address || null,
    locationVerified: row.location_verified,
    packageType: row.package_type,
    packageQuantity: row.package_quantity,
    packageDescription: row.package_description,
    requiresCashOnDelivery: row.requires_cash_on_delivery,
    collectionAmount: Number(row.collection_amount),
    amountCollected: collectedAmount,
    collectedAmount,
    shippingCost: Number(row.shipping_cost),
    paymentMethod: row.payment_method,
    requiresFulfillment: row.requires_fulfillment,
    fulfillmentData: row.fulfillment_data,
    routeOrder: row.route_order,
    settlementStatus: row.settlement_status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deliveredAt: row.delivered_at,
  };
}

async function organizationId(): Promise<string> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("organizations")
    .select("id")
    .eq("slug", "enkargord")
    .single();
  if (error) throw error;
  return data.id;
}

async function toRow(order: EnkargoOrder): Promise<Record<string, unknown>> {
  const sanitized = sanitize(order) as EnkargoOrder;
  return {
    id: order.id,
    tracking: order.tracking,
    organization_id: await organizationId(),
    store_id: nullableText(order.storeId),
    created_by_uid: text(order.createdByUid),
    courier_id: nullableText(order.courierId),
    courier_uid: nullableText(order.courierUid),
    courier_name: text(order.courierName),
    courier_type: text(order.courierType) || "courier",
    status: text(order.status) || "pending",
    customer_name: text(order.customerName),
    customer_phone: text(order.customerPhone),
    customer_email: text(order.customerEmail),
    province_name: text(order.provinceName),
    municipality_name: text(order.municipalityName),
    sector_name: text(order.sectorName),
    street: text(order.street),
    reference: text(order.reference),
    formatted_address: text(order.formattedAddress),
    location_verified: Boolean(order.locationVerified),
    package_type: text(order.packageType) || "Paquete",
    package_quantity: Math.max(1, Math.trunc(numberValue(order.packageQuantity, 1))),
    package_description: text(order.packageDescription),
    requires_cash_on_delivery: Boolean(order.requiresCashOnDelivery),
    collection_amount: numberValue(order.collectionAmount),
    shipping_cost: numberValue(order.shippingCost),
    payment_method: text(order.paymentMethod) || "cash",
    requires_fulfillment: Boolean(order.requiresFulfillment),
    fulfillment_data:
      order.fulfillmentData && typeof order.fulfillmentData === "object"
        ? sanitize(order.fulfillmentData)
        : null,
    route_order:
      order.routeOrder === null || order.routeOrder === undefined
        ? null
        : Math.trunc(numberValue(order.routeOrder)),
    settlement_status: text(order.settlementStatus) || "pending",
    metadata: sanitized,
    created_at: order.createdAt,
    updated_at: order.updatedAt,
    delivered_at: nullableText(order.deliveredAt),
  };
}

export async function createSupabaseOrder(order: EnkargoOrder): Promise<void> {
  const { error } = await getSupabaseBrowserClient()
    .from("orders")
    .insert(await toRow(order));
  if (error) throw error;
}

export async function deleteSupabaseOrder(orderId: string): Promise<void> {
  const { error } = await getSupabaseBrowserClient()
    .from("orders")
    .delete()
    .eq("id", orderId);
  if (error) throw error;
}

const updateColumn = {
  status: "status",
  courierId: "courier_id",
  courierUid: "courier_uid",
  courierName: "courier_name",
  courierType: "courier_type",
  routeOrder: "route_order",
  settlementStatus: "settlement_status",
  deliveredAt: "delivered_at",
  updatedAt: "updated_at",
} as const;

export async function updateSupabaseOrder(
  orderId: string,
  patch: Record<string, unknown>,
): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const { data: current, error: readError } = await supabase
    .from("orders")
    .select("metadata")
    .eq("id", orderId)
    .single();
  if (readError) throw readError;

  const cleanPatch = sanitize(patch) as Record<string, unknown>;
  const columns: Record<string, unknown> = {
    metadata: { ...(current.metadata || {}), ...cleanPatch },
    updated_at: text(cleanPatch.updatedAt) || new Date().toISOString(),
  };
  for (const [source, destination] of Object.entries(updateColumn)) {
    if (source in cleanPatch) columns[destination] = cleanPatch[source];
  }

  const { error } = await supabase.from("orders").update(columns).eq("id", orderId);
  if (error) throw error;
}

export async function addSupabaseOrderEvent(
  orderId: string,
  event: Record<string, unknown>,
): Promise<void> {
  const { error } = await getSupabaseBrowserClient().from("order_events").insert({
    organization_id: await organizationId(),
    order_id: orderId,
    event_type: text(event.type) || text(event.eventType) || "updated",
    previous_status: nullableText(event.previousStatus),
    new_status: nullableText(event.newStatus) || nullableText(event.status),
    actor_uid:
      text(event.actorUid) ||
      text(event.performedByUid) ||
      text(event.createdByUid),
    actor_role: text(event.actorRole) || text(event.performedByRole) || "user",
    courier_id: nullableText(event.courierId),
    note: text(event.note) || text(event.description),
    metadata: sanitize(event),
    created_at: text(event.createdAt) || new Date().toISOString(),
  });
  if (error) throw error;
}

export async function listSupabaseOrders(
  filters: OrderFilters = {},
): Promise<EnkargoOrder[]> {
  let query = getSupabaseBrowserClient()
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });
  if (filters.storeId) query = query.eq("store_id", filters.storeId);
  if (filters.courierId) query = query.eq("courier_id", filters.courierId);
  const { data, error } = await query;
  if (error) throw error;
  return (data as SupabaseOrderRow[]).map(fromRow);
}

export async function getSupabaseOrder(
  orderId: string,
): Promise<EnkargoOrder | null> {
  const { data, error } = await getSupabaseBrowserClient()
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .maybeSingle();
  if (error) throw error;
  return data ? fromRow(data as SupabaseOrderRow) : null;
}

export async function listSupabaseOrderEvents(
  orderId: string,
): Promise<SupabaseOrderEvent[]> {
  const { data, error } = await getSupabaseBrowserClient()
    .from("order_events")
    .select("*")
    .eq("order_id", orderId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map((row) => ({
    ...(row.metadata || {}),
    id: row.id,
    type: row.event_type,
    previousStatus: row.previous_status || "",
    newStatus: row.new_status || "",
    actorRole: row.actor_role,
    note: row.note || "",
    createdAt: row.created_at,
  }));
}

export function subscribeSupabaseOrder(
  orderId: string,
  onData: (order: EnkargoOrder | null) => void,
  onError?: (error: Error) => void,
): () => void {
  const supabase = getSupabaseBrowserClient();
  let active = true;
  const refresh = async () => {
    try {
      const order = await getSupabaseOrder(orderId);
      if (active) onData(order);
    } catch (error) {
      if (active && onError) {
        onError(error instanceof Error ? error : new Error("SUPABASE_ORDER_READ_FAILED"));
      }
    }
  };
  void refresh();
  const channel = supabase
    .channel(`order-${orderId}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "orders", filter: `id=eq.${orderId}` },
      () => void refresh(),
    )
    .subscribe();
  return () => {
    active = false;
    void supabase.removeChannel(channel);
  };
}

export function subscribeSupabaseOrderEvents(
  orderId: string,
  onData: (events: SupabaseOrderEvent[]) => void,
  onError?: (error: Error) => void,
): () => void {
  const supabase = getSupabaseBrowserClient();
  let active = true;
  const refresh = async () => {
    try {
      const events = await listSupabaseOrderEvents(orderId);
      if (active) onData(events);
    } catch (error) {
      if (active && onError) {
        onError(error instanceof Error ? error : new Error("SUPABASE_EVENT_READ_FAILED"));
      }
    }
  };
  void refresh();
  const channel = supabase
    .channel(`order-events-${orderId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "order_events",
        filter: `order_id=eq.${orderId}`,
      },
      () => void refresh(),
    )
    .subscribe();
  return () => {
    active = false;
    void supabase.removeChannel(channel);
  };
}

export function subscribeSupabaseOrders(
  filters: OrderFilters,
  onData: (orders: EnkargoOrder[]) => void,
  onError?: (error: Error) => void,
): () => void {
  const supabase = getSupabaseBrowserClient();
  let active = true;
  let channel: RealtimeChannel | null = null;

  const refresh = async () => {
    try {
      const orders = await listSupabaseOrders(filters);
      if (active) onData(orders);
    } catch (error) {
      if (active && onError) {
        onError(error instanceof Error ? error : new Error("SUPABASE_ORDER_READ_FAILED"));
      }
    }
  };

  void refresh();
  channel = supabase
    .channel(`orders-${filters.storeId || filters.courierId || "all"}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "orders" },
      () => void refresh(),
    )
    .subscribe();

  return () => {
    active = false;
    if (channel) void supabase.removeChannel(channel);
  };
}
