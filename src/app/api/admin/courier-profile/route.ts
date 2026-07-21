import { NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const flowId = `GET-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
  const t0 = performance.now();
  console.log(`[Diagnostic] flowId=${flowId} etapa=courier-profile-get-start timestamp=${new Date().toISOString()}`);

  // Create a timeout controller to interrupt operations taking > 10 seconds
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    // 1. Initialise Admin services
    let adminAuth;
    let adminDb;
    try {
      adminAuth = getAdminAuth();
      adminDb = getAdminDb();
    } catch (initErr: any) {
      clearTimeout(timeoutId);
      console.error(`[Diagnostic] flowId=${flowId} etapa=endpoint-error duration=${(performance.now() - t0).toFixed(0)}ms error=SERVER_INIT_ERROR msg=${initErr?.message}`);
      return NextResponse.json(
        {
          success: false,
          error: 'SERVER_CONFIGURATION_ERROR',
          message: 'Firebase Admin no está configurado correctamente en el servidor.'
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

    // 3. Verify user is Admin
    const userDocRef = adminDb.collection('users').doc(uid);
    const userSnap = await userDocRef.get();

    if (!userSnap.exists) {
      clearTimeout(timeoutId);
      console.warn(`[Diagnostic] flowId=${flowId} etapa=admin-user-read-failed error=USER_NOT_FOUND elapsed=${(performance.now() - t0).toFixed(0)}ms`);
      return NextResponse.json(
        {
          success: false,
          error: 'USER_NOT_FOUND',
          message: 'Usuario no registrado.'
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

    // 4. Query couriers collection
    const courierDocRef = adminDb.collection('couriers').doc(uid);
    const courierSnap = await courierDocRef.get();

    clearTimeout(timeoutId);

    if (!courierSnap.exists) {
      console.log(`[Diagnostic] flowId=${flowId} etapa=courier-query-empty elapsed=${(performance.now() - t0).toFixed(0)}ms`);
      return NextResponse.json({
        success: true,
        exists: false,
        courier: null,
      });
    }

    const courierData = courierSnap.data();
    console.log(`[Diagnostic] flowId=${flowId} etapa=courier-query-success elapsed=${(performance.now() - t0).toFixed(0)}ms`);
    return NextResponse.json({
      success: true,
      exists: true,
      courier: {
        id: courierData?.id || uid,
        userUid: courierData?.userUid || uid,
        status: courierData?.status || 'available',
        active: courierData?.active !== undefined ? courierData.active : true,
      }
    });

  } catch (error: any) {
    clearTimeout(timeoutId);
    console.error(`[Diagnostic] flowId=${flowId} etapa=endpoint-error elapsed=${(performance.now() - t0).toFixed(0)}ms error=INTERNAL_ERROR msg=${error?.message}`);
    return NextResponse.json(
      {
        success: false,
        error: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Error interno al consultar perfil.'
      },
      { status: 500 }
    );
  }
}
