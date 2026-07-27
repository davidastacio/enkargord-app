import { NextResponse } from "next/server";

import { getAdminAuth } from "@/lib/firebase/admin";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ProfilePayload = {
  name?: string;
  email?: string;
  phone?: string;
  role?: "Cliente" | "Tienda" | "Motorista" | "Admin";
  storeId?: string | null;
  createdAt?: string;
};

const membershipRole = {
  Admin: "admin",
  Tienda: "store",
  Motorista: "courier",
  Cliente: "viewer",
} as const;

const allowedSelfServiceRoles = new Set<ProfilePayload["role"]>([
  "Cliente",
  "Tienda",
  "Motorista",
]);

function roleFromClaim(value: unknown): ProfilePayload["role"] | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  if (normalized === "admin" || normalized === "administrador") return "Admin";
  if (normalized === "store" || normalized === "tienda") return "Tienda";
  if (normalized === "courier" || normalized === "motorista") return "Motorista";
  if (normalized === "customer" || normalized === "cliente") return "Cliente";
  return null;
}

export async function GET(request: Request) {
  try {
    const authorization = request.headers.get("authorization");
    if (!authorization?.startsWith("Bearer ")) {
      return NextResponse.json({ success: false }, { status: 401 });
    }
    const decoded = await getAdminAuth().verifyIdToken(
      authorization.slice("Bearer ".length),
    );
    const { data, error } = await getSupabaseAdminClient()
      .from("user_profiles")
      .select("firebase_uid, store_id, courier_id, name, email, phone, role, created_at")
      .eq("firebase_uid", decoded.uid)
      .maybeSingle();
    if (error) throw error;
    if (!data) {
      return NextResponse.json({ success: true, profile: null });
    }
    return NextResponse.json({
      success: true,
      profile: {
        uid: data.firebase_uid,
        storeId: data.store_id,
        courierId: data.courier_id,
        name: data.name,
        email: data.email,
        phone: data.phone,
        role: data.role,
        createdAt: data.created_at,
      },
    });
  } catch (error) {
    console.error("[Supabase profile read]", error);
    return NextResponse.json(
      { success: false, error: "PROFILE_READ_FAILED" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const authorization = request.headers.get("authorization");
    if (!authorization?.startsWith("Bearer ")) {
      return NextResponse.json({ success: false }, { status: 401 });
    }

    const decoded = await getAdminAuth().verifyIdToken(
      authorization.slice("Bearer ".length),
    );
    const body = (await request.json()) as ProfilePayload;
    const supabase = getSupabaseAdminClient();
    const { data: existingProfile, error: existingProfileError } = await supabase
      .from("user_profiles")
      .select("role, store_id")
      .eq("firebase_uid", decoded.uid)
      .maybeSingle();
    if (existingProfileError) throw existingProfileError;

    const claimedRole =
      roleFromClaim(decoded.appRole) ?? roleFromClaim(decoded.applicationRole);
    const requestedRole = body.role || "Cliente";
    const existingRole = existingProfile
      ? roleFromClaim(existingProfile.role) ?? "Cliente"
      : null;
    const role: NonNullable<ProfilePayload["role"]> = existingRole
      ? existingRole === "Cliente" &&
        requestedRole !== "Admin" &&
        allowedSelfServiceRoles.has(requestedRole)
        ? requestedRole
        : existingRole
      : claimedRole === "Admin"
        ? "Admin"
        : allowedSelfServiceRoles.has(requestedRole)
          ? requestedRole
          : "Cliente";

    if (!existingProfile && requestedRole === "Admin" && claimedRole !== "Admin") {
      return NextResponse.json(
        { success: false, error: "ROLE_ESCALATION_DENIED" },
        { status: 403 },
      );
    }

    const { data: organization, error: organizationError } = await supabase
      .from("organizations")
      .select("id")
      .eq("slug", "enkargord")
      .single();
    if (organizationError) throw organizationError;

    const now = new Date().toISOString();
    const requestedStoreId =
      role === "Tienda"
        ? existingProfile?.store_id || body.storeId || null
        : null;
    if (requestedStoreId && !/^[A-Za-z0-9_-]{16,64}$/.test(requestedStoreId)) {
      return NextResponse.json(
        { success: false, error: "INVALID_STORE_ID" },
        { status: 400 },
      );
    }

    if (requestedStoreId && !existingProfile) {
      const { data: occupiedStore, error: occupiedStoreError } = await supabase
        .from("stores")
        .select("owner_uid")
        .eq("id", requestedStoreId)
        .maybeSingle();
      if (occupiedStoreError) throw occupiedStoreError;
      if (occupiedStore && occupiedStore.owner_uid !== decoded.uid) {
        return NextResponse.json(
          { success: false, error: "STORE_ID_ALREADY_IN_USE" },
          { status: 409 },
        );
      }
    }

    const courierId = role === "Motorista" ? decoded.uid : null;
    const profile = {
      firebase_uid: decoded.uid,
      organization_id: organization.id,
      store_id: requestedStoreId,
      courier_id: courierId,
      name: body.name || decoded.name || "",
      email: body.email || decoded.email || "",
      phone: body.phone || "",
      role,
      status: "active",
      created_at: body.createdAt || now,
      updated_at: now,
    };

    const { error: profileError } = await supabase
      .from("user_profiles")
      .upsert(profile, { onConflict: "firebase_uid" });
    if (profileError) throw profileError;

    const { error: membershipError } = await supabase
      .from("organization_members")
      .upsert(
        {
          organization_id: organization.id,
          firebase_uid: decoded.uid,
          role: membershipRole[role],
          status: "active",
          updated_at: now,
        },
        { onConflict: "organization_id,firebase_uid" },
      );
    if (membershipError) throw membershipError;

    if (role === "Tienda" && requestedStoreId) {
      const { error: storeError } = await supabase.from("stores").upsert(
        {
          id: requestedStoreId,
          organization_id: organization.id,
          owner_uid: decoded.uid,
          commercial_name: body.name || "Tienda",
          email: body.email || decoded.email || "",
          phone: body.phone || "",
          status: "active",
          updated_at: now,
        },
        { onConflict: "id" },
      );
      if (storeError) throw storeError;
    }

    if (role === "Motorista") {
      const { error: courierError } = await supabase.from("couriers").upsert(
        {
          id: decoded.uid,
          organization_id: organization.id,
          user_uid: decoded.uid,
          full_name: body.name || decoded.name || "Motorista",
          email: body.email || decoded.email || "",
          phone: body.phone || "",
          operational_type: "courier",
          status: "available",
          active: true,
          updated_at: now,
        },
        { onConflict: "id" },
      );
      if (courierError) throw courierError;
    }

    const adminAuth = getAdminAuth();
    const firebaseUser = await adminAuth.getUser(decoded.uid);
    await adminAuth.setCustomUserClaims(decoded.uid, {
      ...(firebaseUser.customClaims ?? {}),
      role: "authenticated",
      appRole: role,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Supabase profile sync]", error);
    return NextResponse.json(
      { success: false, error: "PROFILE_SYNC_FAILED" },
      { status: 500 },
    );
  }
}
