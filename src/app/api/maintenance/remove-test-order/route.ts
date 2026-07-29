import { createHash, timingSafeEqual } from "node:crypto";

import { getSupabaseAdminClient } from "@/lib/supabase/admin";

const TARGET_ID = "ENK-20260727-BDLM5";
const AUTH_HASH = "ab4664e1106dc068a91d5291b858aae7a6f146f6e97b40c44fc6dc46f42b356f";

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
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select(
      "id,status,customer_name,store_id,courier_id,courier_name,collection_amount,shipping_cost,settlement_status,delivered_at,stores(commercial_name)",
    )
    .eq("id", TARGET_ID)
    .maybeSingle();
  if (orderError) throw orderError;

  const { data: settlements, error: settlementsError } = await supabase
    .from("settlements")
    .select("id,status,order_ids,gross_amount,shipping_amount,commission_amount,net_amount")
    .contains("order_ids", [TARGET_ID]);
  if (settlementsError) throw settlementsError;

  const { data: routes, error: routesError } = await supabase
    .from("courier_routes")
    .select("id,status,order_ids,current_order_index")
    .contains("order_ids", [TARGET_ID]);
  if (routesError) throw routesError;

  if (!confirm) return Response.json({ order, settlements, routes });
  if (!order) {
    return Response.json({ error: "Target order not found" }, { status: 404 });
  }
  if (settlements.length > 0) {
    return Response.json(
      { error: "Order already included in settlements", settlements },
      { status: 409 },
    );
  }

  for (const route of routes) {
    const previousIds = route.order_ids as string[];
    const remainingIds = previousIds.filter((id) => id !== TARGET_ID);
    const currentId = previousIds[route.current_order_index] || null;
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

  const { error: deleteError } = await supabase
    .from("orders")
    .delete()
    .eq("id", TARGET_ID);
  if (deleteError) throw deleteError;

  if (order.courier_id) {
    const [activeResult, completedResult] = await Promise.all([
      supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("courier_id", order.courier_id)
        .in("status", ["assigned", "picked_up", "in_transit", "on_route", "next_delivery"]),
      supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("courier_id", order.courier_id)
        .eq("status", "delivered"),
    ]);
    if (activeResult.error) throw activeResult.error;
    if (completedResult.error) throw completedResult.error;
    const { error } = await supabase
      .from("couriers")
      .update({
        current_order_count: activeResult.count || 0,
        completed_order_count: completedResult.count || 0,
        updated_at: new Date().toISOString(),
      })
      .eq("id", order.courier_id);
    if (error) throw error;
  }

  return Response.json({
    removedOrderId: TARGET_ID,
    adjustedCourier: order.courier_id || null,
    updatedRoutes: routes.map((route) => route.id),
  });
}
