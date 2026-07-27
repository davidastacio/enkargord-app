import { NextResponse } from "next/server";
import type { UserRecord } from "firebase-admin/auth";
import { getAdminAuth } from "@/lib/firebase/admin";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

function requiredText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: Request) {
  let createdFirebaseUser: UserRecord | null = null;

  try {
    const authorization = request.headers.get("authorization") ?? "";
    if (!authorization.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Sesión requerida." }, { status: 401 });
    }

    const adminAuth = getAdminAuth();
    const actor = await adminAuth.verifyIdToken(authorization.slice(7));
    const supabase = getSupabaseAdminClient();
    const { data: actorProfile, error: actorError } = await supabase
      .from("user_profiles")
      .select("firebase_uid,organization_id,role,status")
      .eq("firebase_uid", actor.uid)
      .single();

    if (actorError || actorProfile?.role !== "Admin" || actorProfile.status !== "active") {
      return NextResponse.json({ error: "No tienes permiso para crear motoristas." }, { status: 403 });
    }

    const body = (await request.json()) as Record<string, unknown>;
    const fullName = requiredText(body.fullName);
    const email = requiredText(body.email).toLowerCase();
    const phone = requiredText(body.phone);
    const password = requiredText(body.password);
    if (!fullName || !email || !phone || password.length < 6) {
      return NextResponse.json(
        { error: "Nombre, correo, teléfono y contraseña válida son obligatorios." },
        { status: 400 },
      );
    }

    const digits = phone.replace(/\D/g, "");
    const phoneNumber =
      phone.startsWith("+") ? phone : digits.length === 10 ? `+1${digits}` : `+${digits}`;

    createdFirebaseUser = await adminAuth.createUser({
      email,
      password,
      displayName: fullName,
      ...(phoneNumber.length >= 11 ? { phoneNumber } : {}),
    });

    const uid = createdFirebaseUser.uid;
    const courierId = `COU-${Date.now()}`;
    const now = new Date().toISOString();
    await adminAuth.setCustomUserClaims(uid, { role: "authenticated", appRole: "courier" });

    const { error: profileError } = await supabase.from("user_profiles").insert({
      firebase_uid: uid,
      organization_id: actorProfile.organization_id,
      courier_id: courierId,
      name: fullName,
      email,
      phone,
      role: "Motorista",
      status: "active",
      metadata: {},
      created_at: now,
      updated_at: now,
    });
    if (profileError) throw profileError;

    const { error: memberError } = await supabase.from("organization_members").insert({
      organization_id: actorProfile.organization_id,
      firebase_uid: uid,
      role: "courier",
      status: "active",
      created_at: now,
      updated_at: now,
    });
    if (memberError) throw memberError;

    const metadata = {
      identificationNumber: requiredText(body.identificationNumber),
      address: requiredText(body.address),
      licenseNumber: requiredText(body.licenseNumber),
      assignedZone: requiredText(body.assignedZone),
      assignedProvinceId: requiredText(body.assignedProvinceId),
      assignedProvinceName: requiredText(body.assignedProvinceName),
      assignedMunicipalityId: requiredText(body.assignedMunicipalityId),
      assignedMunicipalityName: requiredText(body.assignedMunicipalityName),
      createdByUid: actor.uid,
    };
    const { error: courierError } = await supabase.from("couriers").insert({
      id: courierId,
      organization_id: actorProfile.organization_id,
      user_uid: uid,
      full_name: fullName,
      email,
      phone,
      operational_type: "courier",
      vehicle_type: requiredText(body.vehicleType) || "motocicleta",
      vehicle_plate: requiredText(body.vehiclePlate),
      vehicle_model: requiredText(body.vehicleModel),
      vehicle_color: requiredText(body.vehicleColor),
      status: "available",
      active: true,
      current_order_count: 0,
      completed_order_count: 0,
      commission_type: body.commissionType === "percentage" ? "percentage" : "fixed",
      commission_value: Number.parseFloat(String(body.commissionValue ?? "100")) || 0,
      metadata,
      created_at: now,
      updated_at: now,
    });
    if (courierError) throw courierError;

    await supabase.from("audit_logs").insert({
      id: `AUD-${Date.now()}`,
      organization_id: actorProfile.organization_id,
      action: "create_courier",
      actor_uid: actor.uid,
      actor_role: "admin",
      target_type: "courier",
      target_id: courierId,
      metadata: { fullName, email, vehiclePlate: requiredText(body.vehiclePlate) },
      created_at: now,
    });

    return NextResponse.json({ success: true, uid, courierId, temporaryPassword: password });
  } catch (error) {
    if (createdFirebaseUser) {
      try {
        await getAdminAuth().deleteUser(createdFirebaseUser.uid);
      } catch (rollbackError) {
        console.error("Could not roll back Firebase courier user:", rollbackError);
      }
    }
    console.error("Error creating courier via API:", error);
    const message = error instanceof Error ? error.message : "Error interno del servidor.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
