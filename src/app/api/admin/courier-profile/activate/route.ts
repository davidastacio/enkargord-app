import { NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const flowId = `ACT-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
  const t0 = performance.now();
  console.log(`[Diagnostic] flowId=${flowId} etapa=activation-start timestamp=${new Date().toISOString()}`);

  // Create a timeout controller to interrupt operations taking > 10 seconds
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    // 1. Initialise Admin services on-demand inside try block
    let adminAuth;
    let adminDb;
    try {
      adminAuth = getAdminAuth();
      adminDb = getAdminDb();
    } catch (initErr: any) {
      clearTimeout(timeoutId);
      console.error(`[Diagnostic] flowId=${flowId} etapa=endpoint-error elapsed=${(performance.now() - t0).toFixed(0)}ms error=SERVER_INIT_ERROR msg=${initErr?.message}`);
      return NextResponse.json(
        {
          success: false,
          error: 'SERVER_CONFIGURATION_ERROR',
          message: 'Firebase Admin no está configurado correctamente en Vercel.'
        },
        { status: 500 }
      );
    }

    console.log(`[Diagnostic] flowId=${flowId} etapa=session-verify-start elapsed=${(performance.now() - t0).toFixed(0)}ms`);

    // 2. Parse Bearer Token
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      clearTimeout(timeoutId);
      console.error(`[Diagnostic] flowId=${flowId} etapa=endpoint-error error=UNAUTHORIZED msg=Missing authorization header`);
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
      const partialUid = decodedToken.uid ? `${decodedToken.uid.slice(0, 5)}...` : 'N/A';
      console.log(`[Diagnostic] flowId=${flowId} etapa=session-verify-success uid=${partialUid} elapsed=${(performance.now() - t0).toFixed(0)}ms`);
    } catch (authErr: any) {
      clearTimeout(timeoutId);
      console.error(`[Diagnostic] flowId=${flowId} etapa=endpoint-error error=TOKEN_VERIFICATION_FAILED msg=${authErr?.message}`);
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
    console.log(`[Diagnostic] flowId=${flowId} etapa=admin-user-read-start elapsed=${(performance.now() - t0).toFixed(0)}ms`);

    // 3. Get user role from users collection
    const userDocRef = adminDb.collection('users').doc(uid);
    const userSnap = await userDocRef.get();

    if (!userSnap.exists) {
      clearTimeout(timeoutId);
      console.warn(`[Diagnostic] flowId=${flowId} etapa=admin-user-read-failed error=USER_NOT_FOUND elapsed=${(performance.now() - t0).toFixed(0)}ms`);
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

    console.log(`[Diagnostic] flowId=${flowId} etapa=admin-user-read-success role=${userRole} elapsed=${(performance.now() - t0).toFixed(0)}ms`);

    if (!isAdmin) {
      clearTimeout(timeoutId);
      console.warn(`[Diagnostic] flowId=${flowId} etapa=admin-user-read-failed error=FORBIDDEN elapsed=${(performance.now() - t0).toFixed(0)}ms`);
      return NextResponse.json(
        {
          success: false,
          error: 'FORBIDDEN',
          message: 'Acceso denegado. Se requiere rol de administrador.'
        },
        { status: 403 }
      );
    }

    console.log(`[Diagnostic] flowId=${flowId} etapa=courier-query-start elapsed=${(performance.now() - t0).toFixed(0)}ms`);

    // 4. Check existing profile
    const courierDocRef = adminDb.collection('couriers').doc(uid);
    const courierSnap = await courierDocRef.get();

    if (courierSnap.exists) {
      clearTimeout(timeoutId);
      const existingData = courierSnap.data();
      console.log(`[Diagnostic] flowId=${flowId} etapa=courier-query-success exists=true elapsed=${(performance.now() - t0).toFixed(0)}ms`);
      
      // Ensure users document is synced just in case
      if (!userData?.courierId || !userData?.courierModeEnabled) {
        await userDocRef.update({
          courierId: uid,
          courierModeEnabled: true,
          updatedAt: new Date().toISOString(),
        });
      }

      console.log(`[Diagnostic] flowId=${flowId} etapa=activation-completed elapsed=${(performance.now() - t0).toFixed(0)}ms`);
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

    console.log(`[Diagnostic] flowId=${flowId} etapa=courier-create-start elapsed=${(performance.now() - t0).toFixed(0)}ms`);

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
    console.log(`[Diagnostic] flowId=${flowId} etapa=courier-create-success elapsed=${(performance.now() - t0).toFixed(0)}ms`);

    console.log(`[Diagnostic] flowId=${flowId} etapa=user-update-start elapsed=${(performance.now() - t0).toFixed(0)}ms`);

    // 6. Update user document
    await userDocRef.update({
      courierId: uid,
      courierModeEnabled: true,
      updatedAt: nowIso,
    });
    console.log(`[Diagnostic] flowId=${flowId} etapa=user-update-success elapsed=${(performance.now() - t0).toFixed(0)}ms`);

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

    clearTimeout(timeoutId);
    console.log(`[Diagnostic] flowId=${flowId} etapa=activation-completed elapsed=${(performance.now() - t0).toFixed(0)}ms`);

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
    clearTimeout(timeoutId);
    console.error(`[Diagnostic] flowId=${flowId} etapa=endpoint-error elapsed=${(performance.now() - t0).toFixed(0)}ms error=INTERNAL_ERROR msg=${error?.message}`);

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
