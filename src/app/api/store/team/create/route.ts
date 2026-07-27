import { NextResponse } from "next/server";
import { getAdminAuth } from "@/lib/firebase/admin";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const authorization = request.headers.get("authorization") ?? "";
    if (!authorization.startsWith("Bearer ")) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }

    const token = authorization.slice(7);
    const decoded = await getAdminAuth().verifyIdToken(token);
    const supabase = getSupabaseAdminClient();

    // 1. Fetch caller profile to verify store ownership
    const { data: callerProfile, error: profileErr } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("firebase_uid", decoded.uid)
      .single();

    if (profileErr || !callerProfile) {
      return NextResponse.json({ error: "CALLER_PROFILE_NOT_FOUND" }, { status: 403 });
    }

    if (callerProfile.role !== "Tienda" && callerProfile.role !== "Admin") {
      return NextResponse.json({ error: "FORBIDDEN_ONLY_STORES_CAN_ADD_TEAM" }, { status: 403 });
    }

    const storeId = callerProfile.store_id || callerProfile.firebase_uid;
    if (!storeId) {
      return NextResponse.json({ error: "STORE_ID_NOT_CONFIGURED" }, { status: 400 });
    }

    // 2. Parse request payload
    const body = await request.json();
    const { name, email, password, phone } = body;

    if (!email || !password || !name) {
      return NextResponse.json({ error: "MISSING_REQUIRED_FIELDS" }, { status: 400 });
    }

    if (String(password).length < 6) {
      return NextResponse.json({ error: "PASSWORD_TOO_SHORT_MIN_6" }, { status: 400 });
    }

    // 3. Create Firebase user for collaborator
    const adminAuth = getAdminAuth();
    let newFirebaseUser;
    try {
      newFirebaseUser = await adminAuth.createUser({
        email: String(email).trim().toLowerCase(),
        password: String(password),
        displayName: String(name).trim(),
        phoneNumber: phone && String(phone).startsWith('+') ? String(phone) : undefined,
      });
    } catch (fbErr: any) {
      console.error("Firebase auth error creating collaborator:", fbErr);
      if (fbErr.code === 'auth/email-already-exists') {
        return NextResponse.json({ error: "EMAIL_ALREADY_IN_USE" }, { status: 409 });
      }
      return NextResponse.json({ error: fbErr.message || "FIREBASE_CREATE_USER_FAILED" }, { status: 400 });
    }

    // 4. Set custom claims for Collaborator
    await adminAuth.setCustomUserClaims(newFirebaseUser.uid, {
      role: "Colaborador",
      appRole: "Colaborador",
      storeId: storeId,
    });

    const now = new Date().toISOString();

    // 5. Create user_profile record in Supabase (Use "Tienda" to satisfy DB check constraint)
    const { error: insertProfileErr } = await supabase
      .from("user_profiles")
      .insert({
        firebase_uid: newFirebaseUser.uid,
        organization_id: callerProfile.organization_id,
        store_id: storeId,
        name: String(name).trim(),
        email: String(email).trim().toLowerCase(),
        phone: phone ? String(phone).trim() : null,
        role: "Tienda",
        status: "active",
        metadata: {
          isCollaborator: true,
          subRole: "Colaborador",
          createdByUid: decoded.uid,
          createdForStore: storeId,
        },
        created_at: now,
        updated_at: now,
      });

    if (insertProfileErr) {
      console.error("Supabase profile insert error:", insertProfileErr);
      await adminAuth.deleteUser(newFirebaseUser.uid).catch(console.error);
      const isRls = insertProfileErr.code === '42501' || String(insertProfileErr.message || '').includes('row-level security');
      const userFriendlyMsg = isRls
        ? "Falta la clave SUPABASE_SECRET_KEY en las variables de entorno de Vercel para autorizar la creación de perfiles de colaboradores sin restricciones RLS."
        : (insertProfileErr.message || "Error al insertar perfil en Supabase");
      return NextResponse.json({
        error: "PROFILE_INSERT_FAILED",
        details: userFriendlyMsg
      }, { status: 400 });
    }

    // 6. Create organization_members entry (Use "store" to satisfy DB check constraint)
    if (callerProfile.organization_id) {
      const { error: orgErr } = await supabase.from("organization_members").insert({
        organization_id: callerProfile.organization_id,
        firebase_uid: newFirebaseUser.uid,
        role: "store",
        status: "active",
        updated_at: now,
      });
      if (orgErr) console.error("Error inserting organization_members:", orgErr);
    }

    return NextResponse.json({
      success: true,
      collaborator: {
        uid: newFirebaseUser.uid,
        name: String(name).trim(),
        email: String(email).trim().toLowerCase(),
        role: "Colaborador",
        storeId: storeId,
      }
    });
  } catch (error: any) {
    console.error("Error creating collaborator:", error);
    return NextResponse.json({ error: error.message || "INTERNAL_SERVER_ERROR" }, { status: 500 });
  }
}
