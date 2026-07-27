import { NextResponse } from "next/server";
import { getAdminAuth } from "@/lib/firebase/admin";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

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
      .select("organization_id,courier_id,name,role")
      .eq("firebase_uid", decoded.uid)
      .single();
    if (profileError || !profile?.courier_id || !["Motorista", "Admin"].includes(profile.role)) {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }

    const body = (await request.json()) as { orderIds?: unknown };
    const orderIds = Array.isArray(body.orderIds)
      ? body.orderIds.filter((id): id is string => typeof id === "string")
      : [];
    if (orderIds.length === 0) {
      return NextResponse.json({ error: "NO_ORDERS" }, { status: 400 });
    }
    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select("*")
      .eq("organization_id", profile.organization_id)
      .in("id", orderIds)
      .eq("courier_id", profile.courier_id)
      .eq("status", "delivered")
      .neq("settlement_status", "settled");
    if (ordersError) throw ordersError;
    if (!orders || orders.length !== orderIds.length) {
      return NextResponse.json({ error: "INVALID_ORDERS" }, { status: 409 });
    }

    const entries = orders.map((order) => {
      const metadata = order.metadata ?? {};
      const shippingCost = Number(order.shipping_cost);
      const commission = Number(metadata.financials?.courierCommission ?? shippingCost);
      return {
        orderId: order.id,
        trackingId: order.tracking,
        storeName: metadata.storeName || "Tienda EnkargoRD",
        amountCollected: Number(metadata.amountCollected ?? order.collection_amount),
        storeAmount: Math.max(0, Number(order.collection_amount) - shippingCost),
        courierCommission: commission,
        beneficiaryAmounts: metadata.financials?.beneficiaryBreakdown ?? [],
        shippingCost,
        fulfillmentCost: Number(metadata.fulfillmentData?.additionalCost ?? 0),
        deliveredAt: order.delivered_at,
      };
    });
    const totalCollected = entries.reduce((sum, entry) => sum + entry.amountCollected, 0);
    const totalForStores = entries.reduce((sum, entry) => sum + entry.storeAmount, 0);
    const totalCourierCommission = entries.reduce((sum, entry) => sum + entry.courierCommission, 0);
    const totalShipping = entries.reduce((sum, entry) => sum + entry.shippingCost, 0);
    const totalCashToDeliver = totalForStores;
    const id = `LIQ-${Date.now()}`;
    const now = new Date().toISOString();
    const metadata = {
      courierName: profile.name || "",
      entries,
      totalCollected,
      totalForStores,
      totalCourierCommission,
      totalBeneficiaryAmounts: 0,
      totalForCompany: totalShipping,
      totalCashToDeliver,
    };
    const { error: settlementError } = await supabase.from("settlements").insert({
      id,
      organization_id: profile.organization_id,
      courier_id: profile.courier_id,
      status: "submitted",
      order_ids: orderIds,
      gross_amount: totalCollected,
      shipping_amount: totalShipping,
      commission_amount: totalCourierCommission,
      net_amount: totalCashToDeliver,
      created_by_uid: decoded.uid,
      metadata,
      created_at: now,
      updated_at: now,
    });
    if (settlementError) throw settlementError;
    const { error: updateError } = await supabase
      .from("orders")
      .update({ settlement_status: "submitted", updated_at: now })
      .eq("organization_id", profile.organization_id)
      .in("id", orderIds);
    if (updateError) throw updateError;
    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error("Error creating courier settlement:", error);
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
