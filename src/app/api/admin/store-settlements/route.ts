import { NextResponse } from "next/server";

import { getAdminAuth } from "@/lib/firebase/admin";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

async function adminContext(request: Request) {
  const authorization = request.headers.get("authorization") ?? "";
  if (!authorization.startsWith("Bearer ")) {
    return { error: NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 }) };
  }
  const decoded = await getAdminAuth().verifyIdToken(authorization.slice(7));
  const supabase = getSupabaseAdminClient();
  const { data: profile, error } = await supabase
    .from("user_profiles")
    .select("firebase_uid, organization_id, role")
    .eq("firebase_uid", decoded.uid)
    .single();
  if (error || profile?.role !== "Admin" || !profile.organization_id) {
    return { error: NextResponse.json({ error: "FORBIDDEN" }, { status: 403 }) };
  }
  return { decoded, profile, supabase };
}

export async function GET(request: Request) {
  try {
    const context = await adminContext(request);
    if ("error" in context) return context.error;
    const [{ data: stores, error: storesError }, { data: orders, error: ordersError }] =
      await Promise.all([
        context.supabase
          .from("stores")
          .select("id, commercial_name, email, phone, settings")
          .eq("organization_id", context.profile.organization_id)
          .order("commercial_name"),
        context.supabase
          .from("orders")
          .select("id, store_id, collection_amount, shipping_cost")
          .eq("organization_id", context.profile.organization_id)
          .eq("status", "delivered")
          .neq("settlement_status", "settled"),
      ]);
    if (storesError) throw storesError;
    if (ordersError) throw ordersError;

    const balances = (stores ?? []).map((store) => {
      const pendingOrders = (orders ?? []).filter((order) => order.store_id === store.id);
      const bank = store.settings?.bankAccount ?? {};
      return {
        storeId: store.id,
        storeName: store.commercial_name || "Tienda",
        email: store.email || "",
        phone: store.phone || "",
        orderCount: pendingOrders.length,
        productBalance: pendingOrders.reduce(
          (sum, order) => sum + Number(order.collection_amount || 0),
          0,
        ),
        shippingTotal: pendingOrders.reduce(
          (sum, order) => sum + Number(order.shipping_cost || 0),
          0,
        ),
        bank: {
          bankName: String(bank.bankName ?? ""),
          accountHolder: String(bank.accountHolder ?? ""),
          accountNumber: String(bank.accountNumber ?? ""),
          accountType: String(bank.accountType ?? ""),
        },
      };
    });
    return NextResponse.json({ balances });
  } catch (error) {
    console.error("Error listing store balances:", error);
    return NextResponse.json({ error: "BALANCES_READ_FAILED" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const context = await adminContext(request);
    if ("error" in context) return context.error;
    const body = (await request.json()) as { storeId?: unknown; paymentReference?: unknown };
    const storeId = String(body.storeId ?? "").trim();
    const paymentReference = String(body.paymentReference ?? "").trim();
    if (!storeId || !paymentReference) {
      return NextResponse.json({ error: "PAYMENT_DATA_REQUIRED" }, { status: 400 });
    }

    const [{ data: store, error: storeError }, { data: orders, error: ordersError }] =
      await Promise.all([
        context.supabase
          .from("stores")
          .select("id, commercial_name, settings")
          .eq("organization_id", context.profile.organization_id)
          .eq("id", storeId)
          .single(),
        context.supabase
          .from("orders")
          .select("id, collection_amount, shipping_cost")
          .eq("organization_id", context.profile.organization_id)
          .eq("store_id", storeId)
          .eq("status", "delivered")
          .neq("settlement_status", "settled"),
      ]);
    if (storeError || !store) return NextResponse.json({ error: "STORE_NOT_FOUND" }, { status: 404 });
    if (ordersError) throw ordersError;
    if (!orders?.length) return NextResponse.json({ error: "NO_PENDING_BALANCE" }, { status: 409 });

    const productAmount = orders.reduce(
      (sum, order) => sum + Number(order.collection_amount || 0),
      0,
    );
    const shippingAmount = orders.reduce(
      (sum, order) => sum + Number(order.shipping_cost || 0),
      0,
    );
    const now = new Date().toISOString();
    const settlementId = `SET-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
    const orderIds = orders.map((order) => order.id);
    const { error: settlementError } = await context.supabase.from("settlements").insert({
      id: settlementId,
      organization_id: context.profile.organization_id,
      store_id: storeId,
      status: "paid",
      order_ids: orderIds,
      gross_amount: productAmount + shippingAmount,
      shipping_amount: shippingAmount,
      commission_amount: shippingAmount,
      net_amount: productAmount,
      created_by_uid: context.decoded.uid,
      approved_by_uid: context.decoded.uid,
      metadata: {
        paymentReference,
        storeName: store.commercial_name,
        bankAccount: store.settings?.bankAccount ?? null,
      },
      created_at: now,
      updated_at: now,
      paid_at: now,
    });
    if (settlementError) throw settlementError;

    const { error: updateError } = await context.supabase
      .from("orders")
      .update({ settlement_status: "settled", updated_at: now })
      .eq("organization_id", context.profile.organization_id)
      .in("id", orderIds);
    if (updateError) {
      await context.supabase.from("settlements").delete().eq("id", settlementId);
      throw updateError;
    }

    return NextResponse.json({
      success: true,
      settlementId,
      paidAmount: productAmount,
      orderCount: orderIds.length,
    });
  } catch (error) {
    console.error("Error paying store settlement:", error);
    return NextResponse.json({ error: "STORE_PAYMENT_FAILED" }, { status: 500 });
  }
}
