import { NextResponse } from "next/server";

import { getAdminAuth } from "@/lib/firebase/admin";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export async function PUT(request: Request) {
  try {
    const authorization = request.headers.get("authorization") ?? "";
    if (!authorization.startsWith("Bearer ")) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }
    const decoded = await getAdminAuth().verifyIdToken(authorization.slice(7));
    const supabase = getSupabaseAdminClient();
    const { data: profile, error: profileError } = await supabase
      .from("user_profiles")
      .select("firebase_uid, organization_id, store_id, role")
      .eq("firebase_uid", decoded.uid)
      .single();
    if (profileError || profile?.role !== "Tienda") {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }

    const body = (await request.json()) as {
      storeId?: unknown;
      patch?: Record<string, unknown>;
    };
    const storeId = String(body.storeId ?? "");
    if (!storeId || storeId !== (profile.store_id || profile.firebase_uid)) {
      return NextResponse.json({ error: "STORE_MISMATCH" }, { status: 403 });
    }
    const patch = body.patch ?? {};
    const commercialName =
      "commercialName" in patch
        ? String(patch.commercialName ?? "").trim()
        : null;
    if (commercialName !== null && !commercialName) {
      return NextResponse.json({ error: "STORE_NAME_REQUIRED" }, { status: 400 });
    }
    const row: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (commercialName !== null) row.commercial_name = commercialName;
    if ("legalName" in patch) row.legal_name = String(patch.legalName ?? "");
    if ("email" in patch) row.email = String(patch.email ?? "");
    if ("phone" in patch) row.phone = String(patch.phone ?? "");
    if ("address" in patch) row.address = String(patch.address ?? "");
    if ("settings" in patch && patch.settings && typeof patch.settings === "object") {
      row.settings = patch.settings;
    }
    const { error } = await supabase.from("stores").upsert(
      {
        id: storeId,
        organization_id: profile.organization_id,
        owner_uid: profile.firebase_uid,
        status: "active",
        ...row,
      },
      { onConflict: "id" },
    );
    if (error) throw error;

    const profilePatch: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (commercialName !== null) {
      profilePatch.name = commercialName;
    }
    if ("email" in patch) profilePatch.email = String(patch.email ?? "").trim().toLowerCase();
    if ("phone" in patch) profilePatch.phone = String(patch.phone ?? "").trim();
    const { error: userProfileError } = await supabase
      .from("user_profiles")
      .update(profilePatch)
      .eq("firebase_uid", decoded.uid);
    if (userProfileError) throw userProfileError;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating store settings:", error);
    return NextResponse.json({ error: "STORE_SETTINGS_UPDATE_FAILED" }, { status: 500 });
  }
}
