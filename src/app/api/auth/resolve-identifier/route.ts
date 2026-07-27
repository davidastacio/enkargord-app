import { NextResponse } from "next/server";

import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const normalizePhone = (value: string) => value.replace(/\D/g, "");

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { identifier?: string };
    const phone = normalizePhone(body.identifier || "");
    if (phone.length < 7) {
      return NextResponse.json({ success: true, email: null });
    }
    const { data, error } = await getSupabaseAdminClient()
      .from("user_profiles")
      .select("email, phone")
      .not("phone", "eq", "");
    if (error) throw error;
    const match = data.find(
      (profile) => normalizePhone(profile.phone || "") === phone,
    );
    return NextResponse.json({
      success: true,
      email: match?.email || null,
    });
  } catch (error) {
    console.error("[Resolve login identifier]", error);
    return NextResponse.json(
      { success: false, email: null },
      { status: 500 },
    );
  }
}
