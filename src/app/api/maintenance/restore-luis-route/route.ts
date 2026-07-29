import { createHash, timingSafeEqual } from "node:crypto";

import { getSupabaseAdminClient } from "@/lib/supabase/admin";

const AUTH_HASH = "4f2eab1db0f005aa18ed8dfaeef9cd690071499a78cfe69e575108cb1c34b3af";

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

  const body = (await request.json().catch(() => ({}))) as {
    confirm?: boolean;
    routeId?: string;
    luisCourierId?: string;
  };
  const supabase = getSupabaseAdminClient();

  const { data: adminCouriers, error: adminCouriersError } = await supabase
    .from("couriers")
    .select("id,user_uid,full_name,status,current_order_count")
    .eq("operational_type", "admin_courier");
  if (adminCouriersError) throw adminCouriersError;

  const adminCourierIds = adminCouriers.map((courier) => courier.id);
  const { data: routes, error: routesError } = adminCourierIds.length
    ? await supabase
        .from("courier_routes")
        .select("id,courier_id,status,order_ids,metadata,created_at")
        .eq("status", "active")
        .in("courier_id", adminCourierIds)
        .order("created_at", { ascending: false })
    : { data: [], error: null };
  if (routesError) throw routesError;

  const routeOrderIds = [...new Set(routes.flatMap((route) => route.order_ids || []))];
  const { data: routeOrders, error: routeOrdersError } = routeOrderIds.length
    ? await supabase
        .from("orders")
        .select("id,status,customer_name,store_id,organization_id,courier_id,courier_name,metadata")
        .in("id", routeOrderIds)
    : { data: [], error: null };
  if (routeOrdersError) throw routeOrdersError;

  const { data: luisCouriers, error: luisError } = await supabase
    .from("couriers")
    .select("id,user_uid,full_name,operational_type,status,current_order_count")
    .ilike("full_name", "%Luis Miguel%");
  if (luisError) throw luisError;

  if (!body.confirm) {
    return Response.json({
      adminCouriers,
      activeAdminRoutes: routes.map((route) => ({
        ...route,
        orders: routeOrders.filter((order) => route.order_ids.includes(order.id)),
      })),
      luisCouriers,
    });
  }

  const route = routes.find((candidate) => candidate.id === body.routeId);
  const luis = luisCouriers.find((candidate) => candidate.id === body.luisCourierId);
  if (!route || route.metadata?.initiatedBy !== "admin") {
    return Response.json({ error: "ADMIN_ROUTE_NOT_FOUND" }, { status: 409 });
  }
  if (!luis || !String(luis.full_name).toLowerCase().includes("luis miguel")) {
    return Response.json({ error: "LUIS_COURIER_NOT_FOUND" }, { status: 409 });
  }

  const affectedOrders = routeOrders.filter(
    (order) =>
      route.order_ids.includes(order.id) &&
      order.courier_id === route.courier_id &&
      order.status === "assigned",
  );
  if (affectedOrders.length !== route.order_ids.length) {
    return Response.json(
      {
        error: "ROUTE_ORDERS_CHANGED",
        routeOrderIds: route.order_ids,
        eligibleOrderIds: affectedOrders.map((order) => order.id),
      },
      { status: 409 },
    );
  }

  const now = new Date().toISOString();
  for (const order of affectedOrders) {
    const metadata = {
      ...(order.metadata || {}),
      restoredToCourierAt: now,
      restoredToCourierId: luis.id,
      accidentalAdminRouteId: route.id,
    };
    const { error } = await supabase
      .from("orders")
      .update({
        courier_id: luis.id,
        courier_uid: luis.user_uid || luis.id,
        courier_name: luis.full_name,
        courier_type: luis.operational_type || "courier",
        status: "assigned",
        metadata,
        updated_at: now,
      })
      .eq("id", order.id);
    if (error) throw error;

    if (order.organization_id) {
      const { error: eventError } = await supabase.from("order_events").insert({
        organization_id: order.organization_id,
        order_id: order.id,
        event_type: "assignment_restored",
        previous_status: "assigned",
        new_status: "assigned",
        actor_uid: route.courier_id,
        actor_role: "admin",
        courier_id: luis.id,
        note: `Asignación restaurada a ${luis.full_name} después de cancelar una ruta administrativa accidental.`,
        metadata: { accidentalAdminRouteId: route.id },
        created_at: now,
      });
      if (eventError) throw eventError;
    }
  }

  const { error: cancelError } = await supabase
    .from("courier_routes")
    .update({
      status: "cancelled",
      updated_at: now,
      metadata: { ...(route.metadata || {}), cancelledReason: "accidental_admin_start" },
    })
    .eq("id", route.id);
  if (cancelError) throw cancelError;

  for (const courierId of [route.courier_id, luis.id]) {
    const { count, error: countError } = await supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("courier_id", courierId)
      .in("status", [
        "assigned",
        "picked_up",
        "in_transit",
        "on_route",
        "next_delivery",
        "customer_unreachable",
      ]);
    if (countError) throw countError;
    const { error } = await supabase
      .from("couriers")
      .update({
        current_order_count: count || 0,
        status: (count || 0) === 0 ? "available" : "on_route",
        updated_at: now,
      })
      .eq("id", courierId);
    if (error) throw error;
  }

  return Response.json({
    cancelledRouteId: route.id,
    restoredCourier: { id: luis.id, name: luis.full_name },
    restoredOrderIds: affectedOrders.map((order) => order.id),
  });
}
