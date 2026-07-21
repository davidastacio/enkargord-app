import { NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  console.log('[API Debug] [activation-request-received] Iniciando POST /api/admin/courier-profile/activate.');

  // Safe Env Logging
  console.log('[API Debug] [firebase-admin-env]', {
    hasProjectId: Boolean(process.env.FIREBASE_ADMIN_PROJECT_ID),
    hasClientEmail: Boolean(process.env.FIREBASE_ADMIN_CLIENT_EMAIL),
    hasPrivateKey: Boolean(process.env.FIREBASE_ADMIN_PRIVATE_KEY),
    privateKeyHasHeader:
      process.env.FIREBASE_ADMIN_PRIVATE_KEY?.includes('BEGIN PRIVATE KEY') ?? false,
  });

  try {
    // 1. Initialise Admin services on-demand inside try block
    let adminAuth;
    let adminDb;
    try {
      adminAuth = getAdminAuth();
      adminDb = getAdminDb();
    } catch (initErr: any) {
      console.error('[API Debug] [SERVER_INIT_ERROR] Error al inicializar Firebase Admin App:', initErr);
      return NextResponse.json(
        {
          success: false,
          error: 'SERVER_CONFIGURATION_ERROR',
          message: 'Firebase Admin no está configurado correctamente en Vercel.'
        },
        { status: 500 }
      );
    }

    // 2. Parse Bearer Token
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('[API Debug] [UNAUTHORIZED] Cabecera de autorización ausente o inválida.');
      return NextResponse.json(
        {
          success: false,
          error: 'UNAUTHORIZED',
          message: 'No autenticado. Falta token de sesión.'
        },
        { status: 401 }
      );
    }

    const idToken = authHeader.split('Bearer ')[1];
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(idToken);
      console.log(`[API Debug] [session-verified] Sesión verificada para UID: ${decodedToken.uid}`);
    } catch (authErr: any) {
      console.error('[API Debug] [TOKEN_VERIFICATION_FAILED] Error verificando ID token:', authErr.message);
      return NextResponse.json(
        {
          success: false,
          error: 'TOKEN_VERIFICATION_FAILED',
          message: 'Sesión inválida o expirada.'
        },
        { status: 401 }
      );
    }

    const uid = decodedToken.uid;

    // 3. Get user role from users collection
    const userDocRef = adminDb.collection('users').doc(uid);
    const userSnap = await userDocRef.get();

    if (!userSnap.exists) {
      console.error(`[API Debug] [USER_NOT_FOUND] No existe registro en users/${uid}`);
      return NextResponse.json(
        {
          success: false,
          error: 'USER_NOT_FOUND',
          message: 'Perfil de usuario no encontrado en la base de datos.'
        },
        { status: 404 }
      );
    }

    const userData = userSnap.data();
    const userRole = userData?.role;

    const isAdmin = userRole === 'admin' || userRole === 'Admin' || userRole === 'Administrador';
    if (!isAdmin) {
      console.error(`[API Debug] [FORBIDDEN] El usuario ${uid} tiene rol ${userRole} (No es administrador).`);
      return NextResponse.json(
        {
          success: false,
          error: 'FORBIDDEN',
          message: 'Acceso denegado. Se requiere rol de administrador.'
        },
        { status: 403 }
      );
    }

    console.log(`[API Debug] [admin-role-verified] Usuario ${uid} verificado como Admin legítimo.`);

    // 4. Check existing profile
    const courierDocRef = adminDb.collection('couriers').doc(uid);
    const courierSnap = await courierDocRef.get();

    if (courierSnap.exists) {
      const existingData = courierSnap.data();
      console.log(`[API Debug] [existing-profile-checked] El perfil operativo couriers/${uid} ya existe.`);
      
      // Ensure users document is synced just in case
      if (!userData?.courierId || !userData?.courierModeEnabled) {
        await userDocRef.update({
          courierId: uid,
          courierModeEnabled: true,
          updatedAt: new Date().toISOString(),
        });
      }

      return NextResponse.json({
        success: true,
        alreadyExisted: true,
        courierId: uid,
        courier: {
          id: uid,
          userUid: uid,
          status: existingData?.status || 'available',
          active: existingData?.active !== undefined ? existingData.active : true,
        }
      });
    }

    // 5. Create new operative profile safely
    const nowIso = new Date().toISOString();
    const adminFullName = userData?.fullName || userData?.name || decodedToken.name || 'Administrador';
    const adminEmail = userData?.email || decodedToken.email || '';
    const adminPhone = userData?.phone || '';

    const newCourierProfile = {
      id: uid,
      userUid: uid,
      userRole: 'admin',
      operationalType: 'admin_courier',
      fullName: adminFullName,
      email: adminEmail,
      phone: adminPhone,
      status: 'available',
      active: true,
      currentOrderCount: 0,
      completedOrderCount: 0,
      createdByUid: uid,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    await courierDocRef.set(newCourierProfile);
    console.log(`[API Debug] [courier-profile-created] Perfil operativo couriers/${uid} guardado.`);

    // 6. Update user document
    await userDocRef.update({
      courierId: uid,
      courierModeEnabled: true,
      updatedAt: nowIso,
    });
    console.log(`[API Debug] [user-profile-updated] users/${uid} actualizado con courierId y courierModeEnabled.`);

    // 7. Audit log
    const auditId = `AUD-${Date.now()}`;
    await adminDb.collection('audit_logs').doc(auditId).set({
      id: auditId,
      action: 'activate_admin_courier_profile',
      actorUid: uid,
      actorRole: 'admin',
      targetType: 'courier_profile',
      targetId: uid,
      metadata: { fullName: adminFullName, email: adminEmail },
      createdAt: nowIso,
    });

    console.log(`[API Debug] [activation-completed] Activación finalizada con éxito.`);

    return NextResponse.json({
      success: true,
      alreadyExisted: false,
      courierId: uid,
      courier: {
        id: uid,
        userUid: uid,
        status: 'available',
        active: true,
      }
    });

  } catch (error: any) {
    console.error('[API Debug] [activation-error]', {
      name: error instanceof Error ? error.name : 'UnknownError',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      {
        success: false,
        error: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'No se pudo activar el perfil operativo.'
      },
      { status: 500 }
    );
  }
}
