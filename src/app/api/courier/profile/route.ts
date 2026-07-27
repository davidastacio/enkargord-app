import { NextResponse } from "next/server";
import { getAdminAuth } from "@/lib/firebase/admin";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

async function context(request: Request) {
  const authorization = request.headers.get("authorization") ?? "";
  if (!authorization.startsWith("Bearer ")) throw new Error("UNAUTHORIZED");
  const decoded = await getAdminAuth().verifyIdToken(authorization.slice(7));
  const supabase = getSupabaseAdminClient();
  const { data: profile, error } = await supabase
    .from("user_profiles")
    .select("courier_id,role")
    .eq("firebase_uid", decoded.uid)
    .single();
  if (error || !profile?.courier_id || !["Motorista", "Admin"].includes(profile.role)) {
    throw new Error("COURIER_PROFILE_NOT_FOUND");
  }
  return { uid: decoded.uid, courierId: profile.courier_id, supabase };
}

export async function GET(request: Request) {
  try {
    const { courierId, supabase } = await context(request);
    const { data, error } = await supabase.from("couriers").select("*").eq("id", courierId).single();
    if (error) throw error;
    return NextResponse.json({ courier: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "INTERNAL_ERROR";
    return NextResponse.json({ error: message }, { status: message === "UNAUTHORIZED" ? 401 : 404 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { courierId, supabase } = await context(request);
    const body = (await request.json()) as Record<string, unknown>;
    const { data: current, error: readError } = await supabase
      .from("couriers")
      .select("metadata")
      .eq("id", courierId)
      .single();
    if (readError) throw readError;

    const text = (key: string) => typeof body[key] === "string" ? String(body[key]).trim() : "";
    const metadata = {
      ...(current.metadata ?? {}),
      ...(body.cedula !== undefined ? { identificationNumber: text("cedula") } : {}),
      ...(body.address !== undefined ? { address: text("address") } : {}),
      ...(body.licenseNumber !== undefined ? { licenseNumber: text("licenseNumber") } : {}),
    };
    const allowedStatus = ["available", "on_route", "offline", "suspended"].includes(text("status"));
    const { error } = await supabase
      .from("couriers")
      .update({
        ...(body.name !== undefined ? { full_name: text("name") } : {}),
        ...(body.phone !== undefined ? { phone: text("phone") } : {}),
        ...(body.email !== undefined ? { email: text("email") } : {}),
        ...(body.vehicleType !== undefined ? { vehicle_type: text("vehicleType") } : {}),
        ...(body.vehiclePlate !== undefined ? { vehicle_plate: text("vehiclePlate") } : {}),
        ...(body.vehicleModel !== undefined ? { vehicle_model: text("vehicleModel") } : {}),
        ...(body.vehicleColor !== undefined ? { vehicle_color: text("vehicleColor") } : {}),
        ...(allowedStatus ? { status: text("status"), active: text("status") !== "offline" } : {}),
        metadata,
        updated_at: new Date().toISOString(),
      })
      .eq("id", courierId);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "INTERNAL_ERROR";
    return NextResponse.json({ error: message }, { status: message === "UNAUTHORIZED" ? 401 : 500 });
  }
}
