import { NextResponse } from "next/server";
import { getAdminAuth } from "@/lib/firebase/admin";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

const ALLOWED_STATUSES = new Set(["active", "inactive", "suspended"]);
const ALLOWED_ROLE_CHANGES = new Set(["Admin"]);

async function requireAdmin(request: Request) {
  const authorization = request.headers.get("authorization") ?? "";
  if (!authorization.startsWith("Bearer ")) throw new Error("UNAUTHORIZED");

  const decoded = await getAdminAuth().verifyIdToken(authorization.slice(7));
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("user_profiles")
    .select("firebase_uid,role,status")
    .eq("firebase_uid", decoded.uid)
    .single();

  if (error || data?.role !== "Admin" || data.status !== "active") {
    throw new Error("FORBIDDEN");
  }
  return { decoded, supabase };
}

export async function PATCH(
  request: Request,
  context: RouteContext<"/api/admin/users/[uid]">,
) {
  try {
    const { decoded, supabase } = await requireAdmin(request);
    const { uid } = await context.params;
    const body = (await request.json()) as { status?: string; role?: string };
    if (
      (!body.status && !body.role) ||
      (body.status && !ALLOWED_STATUSES.has(body.status)) ||
      (body.role && !ALLOWED_ROLE_CHANGES.has(body.role))
    ) {
      return NextResponse.json({ error: "Cambio inválido." }, { status: 400 });
    }

    const { data: target, error: targetError } = await supabase
      .from("user_profiles")
      .select("firebase_uid,organization_id,role,status")
      .eq("firebase_uid", uid)
      .single();
    if (targetError || !target?.organization_id) {
      return NextResponse.json({ error: "Usuario no encontrado." }, { status: 404 });
    }

    const now = new Date().toISOString();
    const { error: profileError } = await supabase
      .from("user_profiles")
      .update({
        ...(body.status ? { status: body.status } : {}),
        ...(body.role ? { role: body.role } : {}),
        updated_at: now,
      })
      .eq("firebase_uid", uid);
    if (profileError) throw profileError;

    if (body.role === "Admin") {
      const { error: membershipError } = await supabase
        .from("organization_members")
        .upsert(
          {
            organization_id: target.organization_id,
            firebase_uid: uid,
            role: "admin",
            status: "active",
            updated_at: now,
          },
          { onConflict: "organization_id,firebase_uid" },
        );
      if (membershipError) throw membershipError;

      const adminAuth = getAdminAuth();
      const firebaseUser = await adminAuth.getUser(uid);
      await adminAuth.setCustomUserClaims(uid, {
        ...(firebaseUser.customClaims ?? {}),
        role: "authenticated",
        appRole: "Admin",
      });
    }

    const { error: auditError } = await supabase.from("audit_logs").insert({
      id: `AUD-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`,
      organization_id: target.organization_id,
      action:
        body.role === "Admin"
          ? "promote_user_to_admin"
          : "update_user_status",
      actor_uid: decoded.uid,
      actor_role: "admin",
      target_type: "user_profile",
      target_id: uid,
      metadata: {
        previousRole: target.role,
        previousStatus: target.status,
        newRole: body.role ?? target.role,
        newStatus: body.status ?? target.status,
      },
    });
    if (auditError) throw auditError;

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "INTERNAL_ERROR";
    const status =
      message === "UNAUTHORIZED" ? 401 : message === "FORBIDDEN" ? 403 : 500;
    console.error("Error updating admin user:", error);
    return NextResponse.json({ error: message }, { status });
  }
}
