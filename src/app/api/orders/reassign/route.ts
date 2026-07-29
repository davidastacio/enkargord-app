import { NextResponse } from "next/server";

import { getAdminAuth } from "@/lib/firebase/admin";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

const REASSIGNABLE_STATUSES = [
  "customer_unreachable",
  "no_answer",
  "failed",
  "failed_delivery",
];

export async function POST(request: Request) {
  try {
    const authorization = request.headers.get("authorization") ?? "";
    if (!authorization.startsWith("Bearer ")) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }

    const decoded = await getAdminAuth().verifyIdToken(authorization.slice(7));
    const supabase = getSupabaseAdminClient();
    const { data: profile, error: profileError } = await supabase
      .from("user_profiles")
      .select("organization_id,role,store_id")
      .eq("firebase_uid", decoded.uid)
      .single();
    if (
      profileError ||
      !profile ||
      !["Admin", "Tienda"].includes(String(profile.role))
    ) {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }

    const body = (await request.json()) as { orderId?: unknown };
    const orderId = typeof body.orderId === "string" ? body.orderId.trim() : "";
    if (!orderId) {
      return NextResponse.json({ error: "ORDER_ID_REQUIRED" }, { status: 400 });
    }

    let orderQuery = supabase
      .from("orders")
      .select("id,status,store_id,courier_id,courier_name,metadata")
      .eq("organization_id", profile.organization_id)
      .eq("id", orderId);
    if (profile.role === "Tienda") {
      orderQuery = orderQuery.eq("store_id", profile.store_id);
    }
    const { data: order, error: orderError } = await orderQuery.maybeSingle();
    if (orderError || !order) {
      return NextResponse.json({ error: "ORDER_NOT_FOUND" }, { status: 404 });
    }
    if (!REASSIGNABLE_STATUSES.includes(order.status)) {
      return NextResponse.json({ error: "ORDER_NOT_REASSIGNABLE" }, { status: 409 });
    }

    const previousCourierId = order.courier_id as string | null;
    const previousCourierName = order.courier_name || "Motorista";
    const now = new Date().toISOString();
    const metadata = {
      ...(order.metadata || {}),
      previousCourierId,
      previousCourierName,
      reassignmentRequestedAt: now,
      reassignmentRequestedByUid: decoded.uid,
    } as Record<string, unknown>;
    delete metadata.assignedAt;
    delete metadata.assignedByUid;

    const { error: updateOrderError } = await supabase
      .from("orders")
      .update({
        status: "pending",
        courier_id: null,
        courier_uid: null,
        courier_name: "",
        courier_type: "",
        metadata,
        updated_at: now,
      })
      .eq("organization_id", profile.organization_id)
      .eq("id", orderId);
    if (updateOrderError) throw updateOrderError;

    const { data: routes, error: routesError } = await supabase
      .from("courier_routes")
      .select("id,order_ids,current_order_index,metadata")
      .eq("organization_id", profile.organization_id)
      .eq("status", "active")
      .contains("order_ids", [orderId]);
    if (routesError) throw routesError;

    for (const route of routes || []) {
      const oldOrderIds = Array.isArray(route.order_ids) ? route.order_ids : [];
      const removedIndex = oldOrderIds.indexOf(orderId);
      const newOrderIds = oldOrderIds.filter((id) => id !== orderId);
      const oldCurrentIndex = Number(route.current_order_index || 0);
      const newCurrentIndex =
        newOrderIds.length === 0
          ? 0
          : Math.min(
              removedIndex >= 0 && removedIndex < oldCurrentIndex
                ? oldCurrentIndex - 1
                : oldCurrentIndex,
              newOrderIds.length - 1,
            );
      const { error } = await supabase
        .from("courier_routes")
        .update({
          order_ids: newOrderIds,
          current_order_index: newCurrentIndex,
          status: newOrderIds.length === 0 ? "cancelled" : "active",
          metadata: { ...(route.metadata || {}), orderIds: newOrderIds, updatedAt: now },
          updated_at: now,
        })
        .eq("id", route.id);
      if (error) throw error;
    }

    if (previousCourierId) {
      const { count: activeCount, error: countError } = await supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("courier_id", previousCourierId)
        .in("status", [
          "assigned",
          "picked_up",
          "in_transit",
          "on_route",
          "next_delivery",
          "customer_unreachable",
          "no_answer",
        ]);
      if (countError) throw countError;
      const { error } = await supabase
        .from("couriers")
        .update({
          current_order_count: activeCount || 0,
          status: (activeCount || 0) === 0 ? "available" : "on_route",
          updated_at: now,
        })
        .eq("organization_id", profile.organization_id)
        .eq("id", previousCourierId);
      if (error) throw error;
    }

    const { error: eventError } = await supabase.from("order_events").insert({
      organization_id: profile.organization_id,
      order_id: orderId,
      event_type: "reassignment_requested",
      previous_status: order.status,
      new_status: "pending",
      actor_uid: decoded.uid,
      actor_role: profile.role,
      courier_id: previousCourierId,
      note: `Pedido habilitado para reasignación. Motorista anterior: ${previousCourierName}.`,
      metadata: {
        requestedByUid: decoded.uid,
        requestedByRole: profile.role,
        previousCourierName,
      },
      created_at: now,
    });
    if (eventError) throw eventError;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error reassigning undelivered order:", error);
    return NextResponse.json({ error: "REASSIGN_ORDER_FAILED" }, { status: 500 });
  }
}
