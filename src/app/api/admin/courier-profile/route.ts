import { NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  console.log('[API Debug] [GET /api/admin/courier-profile] Iniciando consulta de perfil.');

  try {
    // 1. Initialise Admin services
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
          message: 'Firebase Admin no está configurado correctamente en el servidor.'
        },
        { status: 500 }
      );
    }

    // 2. Parse Bearer Token
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
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
    } catch (authErr: any) {
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

    // 3. Verify user is Admin
    const userDocRef = adminDb.collection('users').doc(uid);
    const userSnap = await userDocRef.get();

    if (!userSnap.exists) {
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

    if (!isAdmin) {
      return NextResponse.json(
        {
          success: false,
          error: 'FORBIDDEN',
          message: 'Acceso denegado. Se requiere rol de administrador.'
        },
        { status: 403 }
      );
    }

    // 4. Query couriers collection
    const courierDocRef = adminDb.collection('couriers').doc(uid);
    const courierSnap = await courierDocRef.get();

    if (!courierSnap.exists) {
      return NextResponse.json({
        success: true,
        exists: false,
        courier: null,
      });
    }

    const courierData = courierSnap.data();
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
    console.error('[API Debug] [GET /api/admin/courier-profile] error:', error);
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
