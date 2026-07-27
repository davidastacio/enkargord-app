import { NextResponse } from "next/server";
import { getAdminAuth } from "@/lib/firebase/admin";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  try {
    const authorization = request.headers.get("authorization") ?? "";
    if (!authorization.startsWith("Bearer ")) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }

    const token = authorization.slice(7);
    const decoded = await getAdminAuth().verifyIdToken(token);
    const supabase = getSupabaseAdminClient();

    const { data: callerProfile } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("firebase_uid", decoded.uid)
      .single();

    if (!callerProfile) {
      return NextResponse.json({ error: "CALLER_PROFILE_NOT_FOUND" }, { status: 403 });
    }

    const storeId = callerProfile.store_id || callerProfile.firebase_uid;
    if (!storeId) {
      return NextResponse.json({ team: [] });
    }

    // Query all collaborators registered for this store_id
    const { data: team, error } = await supabase
      .from("user_profiles")
      .select("firebase_uid, name, email, phone, role, metadata, status, created_at")
      .eq("store_id", storeId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    const collaborators = (team || []).filter(u => {
      const meta = (u.metadata as any) ?? {};
      return u.role === "Colaborador" || meta.isCollaborator === true || meta.subRole === "Colaborador";
    });

    return NextResponse.json({ team: collaborators });
  } catch (error: any) {
    console.error("Error listing store team:", error);
    return NextResponse.json({ error: "INTERNAL_SERVER_ERROR" }, { status: 500 });
  }
}
