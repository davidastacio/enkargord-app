import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, error: "UNAUTHORIZED" },
        { status: 401 },
      );
    }

    const { getAdminAuth } = await import("@/lib/firebase/admin");
    const adminAuth = getAdminAuth();
    const idToken = authHeader.slice("Bearer ".length);
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const userRecord = await adminAuth.getUser(decodedToken.uid);
    const currentClaims = userRecord.customClaims ?? {};

    if (currentClaims.role === "authenticated") {
      return NextResponse.json({ success: true, alreadyConfigured: true });
    }

    const previousRole =
      typeof currentClaims.appRole === "string"
        ? currentClaims.appRole
        : typeof currentClaims.role === "string"
          ? currentClaims.role
          : null;

    await adminAuth.setCustomUserClaims(decodedToken.uid, {
      ...currentClaims,
      role: "authenticated",
      ...(previousRole ? { appRole: previousRole } : {}),
    });

    return NextResponse.json({ success: true, alreadyConfigured: false });
  } catch (error) {
    console.error("Error configuring Supabase Firebase claim:", error);
    return NextResponse.json(
      { success: false, error: "CLAIM_CONFIGURATION_FAILED" },
      { status: 500 },
    );
  }
}

