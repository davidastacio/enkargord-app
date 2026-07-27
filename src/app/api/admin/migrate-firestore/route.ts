import { NextResponse } from "next/server";

import { getAdminAuth } from "@/lib/firebase/admin";
import { migrateFirestoreToSupabase } from "@/lib/supabase/migrate-firestore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const authorization = request.headers.get("authorization");
    if (!authorization?.startsWith("Bearer ")) {
      return NextResponse.json({ success: false }, { status: 401 });
    }
    const decoded = await getAdminAuth().verifyIdToken(
      authorization.slice("Bearer ".length),
    );
    const appRole =
      typeof decoded.appRole === "string" ? decoded.appRole : decoded.role;
    if (!["admin", "Admin", "Administrador"].includes(String(appRole))) {
      return NextResponse.json({ success: false }, { status: 403 });
    }

    const result = await migrateFirestoreToSupabase();
    return NextResponse.json({ success: true, result });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "FIRESTORE_MIGRATION_FAILED";
    console.error("[Firestore migration]", message);
    return NextResponse.json(
      { success: false, error: "MIGRATION_FAILED", message },
      { status: 500 },
    );
  }
}
