"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export type CourierRoute = Record<string, unknown> & {
  id: string;
  courierId: string;
  courierUid: string;
  orderIds: string[];
  currentOrderId: string | null;
  nextOrderId: string | null;
  status: "active" | "completed" | "cancelled";
  createdAt: string;
  updatedAt: string;
};

const organizationId = async () => {
  const { data, error } = await getSupabaseBrowserClient()
    .from("organizations")
    .select("id")
    .eq("slug", "enkargord")
    .single();
  if (error) throw error;
  return data.id;
};

const fromRow = (row: Record<string, any>): CourierRoute => {
  const orderIds = Array.isArray(row.order_ids) ? row.order_ids : [];
  const index = Number(row.current_order_index || 0);
  return {
    ...(row.metadata || {}),
    id: row.id,
    courierId: row.courier_id,
    courierUid: row.courier_uid,
    orderIds,
    currentOrderId: orderIds[index] || null,
    nextOrderId: orderIds[index + 1] || null,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    completedAt: row.completed_at,
  };
};

export async function getActiveSupabaseRoute(
  courierId: string,
): Promise<CourierRoute | null> {
  const { data, error } = await getSupabaseBrowserClient()
    .from("courier_routes")
    .select("*")
    .eq("courier_id", courierId)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data ? fromRow(data) : null;
}

export async function createSupabaseRoute(route: CourierRoute): Promise<void> {
  const currentIndex = Math.max(0, route.orderIds.indexOf(route.currentOrderId || ""));
  const { error } = await getSupabaseBrowserClient().from("courier_routes").insert({
    id: route.id,
    organization_id: await organizationId(),
    courier_id: route.courierId,
    courier_uid: route.courierUid,
    status: route.status,
    order_ids: route.orderIds,
    current_order_index: currentIndex,
    created_at: route.createdAt,
    updated_at: route.updatedAt,
    metadata: route,
  });
  if (error) throw error;
}

export async function updateSupabaseRoute(
  routeId: string,
  patch: Record<string, unknown>,
): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const { data: current, error: readError } = await supabase
    .from("courier_routes")
    .select("metadata, order_ids, current_order_index")
    .eq("id", routeId)
    .single();
  if (readError) throw readError;
  const orderIds = Array.isArray(current.order_ids) ? current.order_ids : [];
  const currentOrderId =
    typeof patch.currentOrderId === "string" ? patch.currentOrderId : null;
  const columns: Record<string, unknown> = {
    metadata: { ...(current.metadata || {}), ...patch },
    updated_at:
      typeof patch.updatedAt === "string"
        ? patch.updatedAt
        : new Date().toISOString(),
  };
  if (typeof patch.status === "string") columns.status = patch.status;
  if (currentOrderId) {
    columns.current_order_index = Math.max(0, orderIds.indexOf(currentOrderId));
  }
  if (patch.currentOrderId === null) {
    columns.current_order_index = orderIds.length;
  }
  if (typeof patch.completedAt === "string") {
    columns.completed_at = patch.completedAt;
  }
  const { error } = await supabase
    .from("courier_routes")
    .update(columns)
    .eq("id", routeId);
  if (error) throw error;
}

export function subscribeSupabaseActiveRoute(
  courierId: string,
  onData: (route: CourierRoute | null) => void,
  onError?: (error: Error) => void,
) {
  const supabase = getSupabaseBrowserClient();
  let active = true;
  const refresh = async () => {
    try {
      const route = await getActiveSupabaseRoute(courierId);
      if (active) onData(route);
    } catch (error) {
      if (active && onError) {
        onError(error instanceof Error ? error : new Error("ROUTE_READ_FAILED"));
      }
    }
  };
  void refresh();
  const channel = supabase
    .channel(`courier-route-${courierId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "courier_routes",
        filter: `courier_id=eq.${courierId}`,
      },
      () => void refresh(),
    )
    .subscribe();
  return () => {
    active = false;
    void supabase.removeChannel(channel);
  };
}
