import { NextResponse } from "next/server";

import { getAdminAuth } from "@/lib/firebase/admin";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

async function authenticatedProfile(request: Request) {
  const authorization = request.headers.get("authorization") ?? "";
  if (!authorization.startsWith("Bearer ")) {
    return { error: NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 }) };
  }

  const decoded = await getAdminAuth().verifyIdToken(authorization.slice(7));
  const supabase = getSupabaseAdminClient();
  const { data: profile, error } = await supabase
    .from("user_profiles")
    .select("firebase_uid, organization_id, role, metadata")
    .eq("firebase_uid", decoded.uid)
    .single();

  if (error || !profile?.organization_id) {
    return { error: NextResponse.json({ error: "PROFILE_NOT_FOUND" }, { status: 404 }) };
  }
  return { profile, supabase };
}

export async function GET(request: Request) {
  try {
    const context = await authenticatedProfile(request);
    if ("error" in context) return context.error;

    const { data: adminProfiles, error } = await context.supabase
      .from("user_profiles")
      .select("metadata, updated_at")
      .eq("organization_id", context.profile.organization_id)
      .eq("role", "Admin")
      .order("updated_at", { ascending: false });
    if (error) throw error;

    const settings = (adminProfiles ?? [])
      .map((admin) => admin.metadata?.operationSettings)
      .find((value) => value && typeof value === "object");

    return NextResponse.json({ settings: settings ?? null });
  } catch (error) {
    console.error("Error reading operation settings:", error);
    return NextResponse.json({ error: "SETTINGS_READ_FAILED" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const context = await authenticatedProfile(request);
    if ("error" in context) return context.error;
    if (context.profile.role !== "Admin") {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }

    const body = (await request.json()) as { settings?: unknown };
    if (!body.settings || typeof body.settings !== "object" || Array.isArray(body.settings)) {
      return NextResponse.json({ error: "INVALID_SETTINGS" }, { status: 400 });
    }

    const updatedAt = new Date().toISOString();
    const { error } = await context.supabase
      .from("user_profiles")
      .update({
        metadata: {
          ...(context.profile.metadata ?? {}),
          operationSettings: body.settings,
        },
        updated_at: updatedAt,
      })
      .eq("firebase_uid", context.profile.firebase_uid);
    if (error) throw error;

    return NextResponse.json({ success: true, updatedAt });
  } catch (error) {
    console.error("Error saving operation settings:", error);
    return NextResponse.json({ error: "SETTINGS_SAVE_FAILED" }, { status: 500 });
  }
}
