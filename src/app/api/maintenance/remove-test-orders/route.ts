import { createHash, timingSafeEqual } from "node:crypto";

import { getSupabaseAdminClient } from "@/lib/supabase/admin";

const AUTH_HASH = "a20fc51ab501fab2ef2b2b5994d43874c42da1570f3e32a17aa5c93c80e7ef8a";
const TARGET_IDS = [
  "ENK-20260727-B7TDH",
  "ENK-20260728-6E59N",
  "ENK-20260728-X4YSP",
] as const;

const authorized = (request: Request) => {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || "";
  const received = Buffer.from(createHash("sha256").update(token).digest("hex"));
  const expected = Buffer.from(AUTH_HASH);
  return received.length === expected.length && timingSafeEqual(received, expected);
};

export async function POST(request: Request) {
  if (!authorized(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { confirm = false } = (await request.json().catch(() => ({}))) as {
    confirm?: boolean;
  };
  const supabase = getSupabaseAdminClient();

  const { data: orders, error: ordersError } = await supabase
    .from("orders")
    .select(
      "id,status,customer_name,store_id,courier_id,courier_name,collection_amount,shipping_cost,settlement_status,delivered_at,stores(commercial_name)",
    )
    .in("id", [...TARGET_IDS]);
  if (ordersError) throw ordersError;

  const { data: settlements, error: settlementsError } = await supabase
    .from("settlements")
    .select(
      "id,status,order_ids,gross_amount,shipping_amount,commission_amount,net_amount,store_id,courier_id",
    )
    .overlaps("order_ids", [...TARGET_IDS]);
  if (settlementsError) throw settlementsError;

  const { data: routes, error: routesError } = await supabase
    .from("courier_routes")
    .select("id,status,order_ids,current_order_index,courier_id")
    .overlaps("order_ids", [...TARGET_IDS]);
  if (routesError) throw routesError;

  if (!confirm) {
    return Response.json({ orders, settlements, routes });
  }

  if (orders.length !== TARGET_IDS.length) {
    return Response.json(
      {
        error: "Target mismatch",
        expected: TARGET_IDS,
        found: orders.map((order) => order.id),
      },
      { status: 409 },
    );
  }

  if (settlements.length > 0) {
    return Response.json(
      { error: "Orders already included in settlements", settlements },
      { status: 409 },
    );
  }

  for (const route of routes) {
    const remainingIds = (route.order_ids as string[]).filter(
      (id) => !TARGET_IDS.includes(id as (typeof TARGET_IDS)[number]),
    );
    const currentId = (route.order_ids as string[])[route.current_order_index] || null;
    const nextCurrentId =
      currentId && remainingIds.includes(currentId)
        ? currentId
        : remainingIds[Math.min(route.current_order_index, remainingIds.length - 1)] || null;
    const nextIndex = nextCurrentId ? remainingIds.indexOf(nextCurrentId) : remainingIds.length;

    const { error } = await supabase
      .from("courier_routes")
      .update({
        order_ids: remainingIds,
        current_order_index: nextIndex,
        ...(remainingIds.length === 0
          ? { status: "completed", completed_at: new Date().toISOString() }
          : {}),
        updated_at: new Date().toISOString(),
      })
      .eq("id", route.id);
    if (error) throw error;
  }

  const courierAdjustments = new Map<
    string,
    { active: number; delivered: number }
  >();
  for (const order of orders) {
    if (!order.courier_id) continue;
    const adjustment = courierAdjustments.get(order.courier_id) || {
      active: 0,
      delivered: 0,
    };
    if (["assigned", "picked_up", "in_transit", "on_route", "next_delivery"].includes(order.status)) {
      adjustment.active += 1;
    }
    if (order.status === "delivered") adjustment.delivered += 1;
    courierAdjustments.set(order.courier_id, adjustment);
  }

  for (const [courierId, adjustment] of courierAdjustments) {
    const { data: courier, error: courierError } = await supabase
      .from("couriers")
      .select("current_order_count,completed_order_count")
      .eq("id", courierId)
      .single();
    if (courierError) throw courierError;

    const { error } = await supabase
      .from("couriers")
      .update({
        current_order_count: Math.max(
          0,
          Number(courier.current_order_count || 0) - adjustment.active,
        ),
        completed_order_count: Math.max(
          0,
          Number(courier.completed_order_count || 0) - adjustment.delivered,
        ),
        updated_at: new Date().toISOString(),
      })
      .eq("id", courierId);
    if (error) throw error;
  }

  const { error: deleteError } = await supabase
    .from("orders")
    .delete()
    .in("id", [...TARGET_IDS]);
  if (deleteError) throw deleteError;

  return Response.json({
    removedOrderIds: TARGET_IDS,
    removedOrderCount: orders.length,
    adjustedCouriers: [...courierAdjustments.keys()],
    updatedRoutes: routes.map((route) => route.id),
  });
}
