import { NextResponse } from "next/server";
import { getAdminAuth } from "@/lib/firebase/admin";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { logisticsRegion, routeLabel } from "@/lib/logistics/regions";
import { prioritizeDeliveryOrders } from "@/lib/logistics/route-priority";

const ACTIVE_ROUTE_ORDER_STATUSES = [
  "assigned",
  "picked_up",
  "in_transit",
  "on_route",
  "next_delivery",
  "rescheduled",
];

export async function POST(request: Request) {
  try {
    const authorization = request.headers.get("authorization") ?? "";
    if (!authorization.startsWith("Bearer ")) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    const decoded = await getAdminAuth().verifyIdToken(authorization.slice(7));
    const supabase = getSupabaseAdminClient();
    const { data: profile, error: profileError } = await supabase
      .from("user_profiles").select("*").eq("firebase_uid", decoded.uid).single();
    if (profileError || profile.role !== "Admin") return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    const body = (await request.json()) as { orderIds?: unknown; region?: unknown; province?: unknown };
    const orderIds = Array.isArray(body.orderIds) ? body.orderIds.filter((id): id is string => typeof id === "string") : [];
    const region = String(body.region ?? "");
    const province = typeof body.province === "string" ? body.province.trim() : "";
    if (!orderIds.length) return NextResponse.json({ error: "NO_ORDERS" }, { status: 400 });

    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select("id,province_name,municipality_name,sector_name,metadata,route_order")
      .eq("organization_id", profile.organization_id)
      .in("id", orderIds);
    if (ordersError) throw ordersError;
    if (!orders || orders.length !== orderIds.length || orders.some((order) => logisticsRegion(order.province_name) !== region)) {
      return NextResponse.json({ error: "REGION_MISMATCH" }, { status: 409 });
    }
    if (province && orders.some((order) => order.province_name !== province)) {
      return NextResponse.json({ error: "PROVINCE_MISMATCH" }, { status: 409 });
    }

    const { data: activeRoute, error: activeRouteError } = await supabase
      .from("courier_routes")
      .select("id,order_ids")
      .eq("organization_id", profile.organization_id)
      .eq("courier_id", decoded.uid)
      .eq("status", "active")
      .limit(1)
      .maybeSingle();
    if (activeRouteError) throw activeRouteError;

    const previousOrderIds = Array.isArray(activeRoute?.order_ids)
      ? activeRoute.order_ids.filter((id): id is string => typeof id === "string" && !orderIds.includes(id))
      : [];
    let previousOrders: typeof orders = [];
    if (previousOrderIds.length > 0) {
      const { data, error } = await supabase
        .from("orders")
        .select("id,province_name,municipality_name,sector_name,metadata,route_order")
        .eq("organization_id", profile.organization_id)
        .eq("courier_id", decoded.uid)
        .in("status", ACTIVE_ROUTE_ORDER_STATUSES)
        .in("id", previousOrderIds);
      if (error) throw error;
      previousOrders = data || [];
    }

    const routeOrders = [...previousOrders, ...orders];
    const prioritizedOrders = prioritizeDeliveryOrders(
      routeOrders.map((order) => ({
        ...order,
        ...(order.metadata || {}),
        id: order.id,
        provinceName: order.province_name,
        municipalityName: order.municipality_name,
        sectorName: order.sector_name,
        routeOrder: order.route_order,
      })),
    );
    const prioritizedOrderIds = prioritizedOrders.map((order) => order.id);
    const now = new Date().toISOString();
    await supabase.from("couriers").upsert({
      id: decoded.uid,
      organization_id: profile.organization_id,
      user_uid: decoded.uid,
      full_name: profile.name || decoded.name || "Administrador",
      email: profile.email || decoded.email || "",
      phone: profile.phone || "",
      operational_type: "admin_courier",
      status: "on_route",
      active: true,
      updated_at: now,
    }, { onConflict: "id" });
    await supabase.from("user_profiles").update({
      courier_id: decoded.uid,
      courier_mode_enabled: true,
      updated_at: now,
    }).eq("firebase_uid", decoded.uid);
    const { error: assignError } = await supabase.from("orders").update({
      courier_id: decoded.uid,
      courier_uid: decoded.uid,
      courier_name: profile.name || "Administrador",
      courier_type: "admin_courier",
      status: "assigned",
      updated_at: now,
    }).eq("organization_id", profile.organization_id).in("id", orderIds);
    if (assignError) throw assignError;
    const routeOrderResults = await Promise.all(
      prioritizedOrderIds.map((orderId, index) =>
        supabase.from("orders").update({ route_order: index + 1 }).eq("id", orderId),
      ),
    );
    const routeOrderError = routeOrderResults.find((result) => result.error)?.error;
    if (routeOrderError) throw routeOrderError;
    await supabase.from("courier_routes").update({
      status: "cancelled",
      updated_at: now,
    })
      .eq("organization_id", profile.organization_id)
      .eq("courier_id", decoded.uid)
      .eq("status", "active");
    const id = `RTE-${Date.now()}`;
    const label = province ? `Ruta provincial: ${province}` : routeLabel(region as any, orders[0]?.province_name);
    const { error: routeError } = await supabase.from("courier_routes").insert({
      id,
      organization_id: profile.organization_id,
      courier_id: decoded.uid,
      courier_uid: decoded.uid,
      status: "active",
      order_ids: prioritizedOrderIds,
      current_order_index: 0,
      metadata: { region, province: province || null, label, initiatedBy: "admin", createdAt: now },
      created_at: now,
      updated_at: now,
    });
    if (routeError) throw routeError;
    return NextResponse.json({ success: true, routeId: id, courierId: decoded.uid, label });
  } catch (error) {
    console.error("Error starting regional route:", error);
    return NextResponse.json({ error: "ROUTE_START_FAILED" }, { status: 500 });
  }
}
