import { NextResponse } from "next/server";

import { getAdminAuth } from "@/lib/firebase/admin";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function bearerToken(request: Request): string | null {
  const authorization = request.headers.get("authorization");
  return authorization?.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : null;
}

export async function POST(request: Request) {
  try {
    const token = bearerToken(request);
    if (!token) {
      return NextResponse.json(
        { success: false, error: "UNAUTHORIZED", message: "No autenticado." },
        { status: 401 },
      );
    }

    const decodedToken = await getAdminAuth().verifyIdToken(token);
    const supabase = getSupabaseAdminClient();
    const { data: profile, error: profileError } = await supabase
      .from("user_profiles")
      .select("firebase_uid, organization_id, name, email, phone, role")
      .eq("firebase_uid", decodedToken.uid)
      .maybeSingle();

    if (profileError) throw profileError;
    if (!profile) {
      return NextResponse.json(
        {
          success: false,
          error: "USER_NOT_FOUND",
          message: "Perfil de administrador no encontrado en Supabase.",
        },
        { status: 404 },
      );
    }

    if (profile.role !== "Admin") {
      return NextResponse.json(
        {
          success: false,
          error: "FORBIDDEN",
          message: "Se requiere rol de administrador.",
        },
        { status: 403 },
      );
    }

    const now = new Date().toISOString();
    const courier = {
      id: decodedToken.uid,
      organization_id: profile.organization_id,
      user_uid: decodedToken.uid,
      full_name: profile.name || decodedToken.name || "Administrador",
      email: profile.email || decodedToken.email || "",
      phone: profile.phone || "",
      operational_type: "admin_courier",
      status: "available",
      active: true,
      updated_at: now,
    };

    const { data: existingCourier, error: existingError } = await supabase
      .from("couriers")
      .select("id")
      .eq("id", decodedToken.uid)
      .maybeSingle();

    if (existingError) throw existingError;

    const { error: courierError } = await supabase
      .from("couriers")
      .upsert(courier, { onConflict: "id" });
    if (courierError) throw courierError;

    const { error: userError } = await supabase
      .from("user_profiles")
      .update({
        courier_id: decodedToken.uid,
        courier_mode_enabled: true,
        updated_at: now,
      })
      .eq("firebase_uid", decodedToken.uid);
    if (userError) throw userError;

    const { error: auditError } = await supabase.from("audit_logs").insert({
      id: `AUD-${Date.now()}`,
      organization_id: profile.organization_id,
      action: "activate_admin_courier_profile",
      actor_uid: decodedToken.uid,
      actor_role: "admin",
      target_type: "courier_profile",
      target_id: decodedToken.uid,
      metadata: { email: courier.email, fullName: courier.full_name },
      created_at: now,
    });
    if (auditError) throw auditError;

    return NextResponse.json({
      success: true,
      alreadyExisted: Boolean(existingCourier),
      courierId: decodedToken.uid,
      courier: {
        id: decodedToken.uid,
        userUid: decodedToken.uid,
        status: courier.status,
        active: courier.active,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "No se pudo activar el perfil.";
    console.error("[Courier activation]", message);
    return NextResponse.json(
      { success: false, error: "INTERNAL_ERROR", message },
      { status: 500 },
    );
  }
}
