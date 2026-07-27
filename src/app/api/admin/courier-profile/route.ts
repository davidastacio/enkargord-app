import { NextResponse } from "next/server";

import { getAdminAuth } from "@/lib/firebase/admin";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const authorization = request.headers.get("authorization");
    if (!authorization?.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, error: "UNAUTHORIZED", message: "No autenticado." },
        { status: 401 },
      );
    }

    const decodedToken = await getAdminAuth().verifyIdToken(
      authorization.slice("Bearer ".length),
    );
    const supabase = getSupabaseAdminClient();
    const { data: profile, error: profileError } = await supabase
      .from("user_profiles")
      .select("role")
      .eq("firebase_uid", decodedToken.uid)
      .maybeSingle();

    if (profileError) throw profileError;
    if (!profile) {
      return NextResponse.json(
        { success: false, error: "USER_NOT_FOUND", message: "Usuario no registrado." },
        { status: 404 },
      );
    }
    if (profile.role !== "Admin") {
      return NextResponse.json(
        { success: false, error: "FORBIDDEN", message: "Acceso denegado." },
        { status: 403 },
      );
    }

    const { data: courier, error: courierError } = await supabase
      .from("couriers")
      .select("id, user_uid, status, active")
      .eq("id", decodedToken.uid)
      .maybeSingle();

    if (courierError) throw courierError;
    if (!courier) {
      return NextResponse.json({ success: true, exists: false, courier: null });
    }

    return NextResponse.json({
      success: true,
      exists: true,
      courier: {
        id: courier.id,
        userUid: courier.user_uid || decodedToken.uid,
        status: courier.status,
        active: courier.active,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Error interno al consultar perfil.";
    console.error("[Courier profile]", message);
    return NextResponse.json(
      { success: false, error: "INTERNAL_ERROR", message },
      { status: 500 },
    );
  }
}
