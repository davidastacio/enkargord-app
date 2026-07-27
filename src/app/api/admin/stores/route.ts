import { NextResponse } from "next/server";

import { getAdminAuth } from "@/lib/firebase/admin";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
      .select("organization_id, role")
      .eq("firebase_uid", decoded.uid)
      .single();
    if (profileError || profile?.role !== "Admin" || !profile.organization_id) {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }

    const body = (await request.json()) as {
      commercialName?: unknown;
      phone?: unknown;
    };
    const commercialName = String(body.commercialName ?? "").trim();
    const phone = String(body.phone ?? "").trim();
    if (!commercialName) {
      return NextResponse.json({ error: "STORE_NAME_REQUIRED" }, { status: 400 });
    }

    const { data: existing, error: existingError } = await supabase
      .from("stores")
      .select("id, commercial_name")
      .eq("organization_id", profile.organization_id)
      .ilike("commercial_name", commercialName)
      .limit(1)
      .maybeSingle();
    if (existingError) throw existingError;
    if (existing) {
      return NextResponse.json({
        store: { id: existing.id, commercialName: existing.commercial_name },
        created: false,
      });
    }

    const storeId = `EXT-${crypto.randomUUID().replaceAll("-", "").slice(0, 16).toUpperCase()}`;
    const now = new Date().toISOString();
    const { data: created, error: createError } = await supabase
      .from("stores")
      .insert({
        id: storeId,
        organization_id: profile.organization_id,
        owner_uid: null,
        commercial_name: commercialName,
        phone,
        status: "active",
        settings: {
          external: true,
          managedByAdmin: true,
          createdByUid: decoded.uid,
        },
        created_at: now,
        updated_at: now,
      })
      .select("id, commercial_name")
      .single();
    if (createError) throw createError;

    return NextResponse.json({
      store: { id: created.id, commercialName: created.commercial_name },
      created: true,
    });
  } catch (error) {
    console.error("Error ensuring external store:", error);
    return NextResponse.json({ error: "EXTERNAL_STORE_CREATE_FAILED" }, { status: 500 });
  }
}
