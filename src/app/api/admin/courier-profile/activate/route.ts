import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';

export async function POST(request: Request) {
  try {
    if (!adminAuth || !adminDb) {
      return NextResponse.json(
        { error: 'Firebase Admin SDK no está inicializado.' },
        { status: 500 }
      );
    }

    // 1. Verify Authorization Bearer Header (Session or ID Token)
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'No autenticado. Falta token de sesión.' },
        { status: 401 }
      );
    }

    const idToken = authHeader.split('Bearer ')[1];
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(idToken);
    } catch (authErr) {
      console.error('[API Auth Error] Token inválido:', authErr);
      return NextResponse.json(
        { error: 'Token de autenticación no válido o expirado.' },
        { status: 401 }
      );
    }

    const uid = decodedToken.uid;

    // 2. Fetch user profile securely from Firestore using Admin SDK
    const userDocRef = adminDb.collection('users').doc(uid);
    const userSnap = await userDocRef.get();

    if (!userSnap.exists) {
      return NextResponse.json(
        { error: 'Perfil de usuario no encontrado.' },
        { status: 404 }
      );
    }

    const userData = userSnap.data();
    const userRole = userData?.role;

    // 3. Confirm user is genuinely an Admin
    const isAdmin = userRole === 'admin' || userRole === 'Admin' || userRole === 'Administrador';
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Acceso denegado. Solo administradores pueden realizar esta acción.' },
        { status: 403 }
      );
    }

    // 4. Check if operative courier profile already exists in `couriers` collection
    const courierDocRef = adminDb.collection('couriers').doc(uid);
    const courierSnap = await courierDocRef.get();

    if (courierSnap.exists) {
      const existingData = courierSnap.data();
      return NextResponse.json({
        success: true,
        courierId: uid,
        alreadyExisted: true,
        data: existingData,
      });
    }

    // 5. Create operative profile via Server Admin SDK without altering Auth UID or principal role
    const nowIso = new Date().toISOString();
    const adminFullName = userData?.name || userData?.displayName || decodedToken.name || 'Administrador';
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

    // 6. Update `users/{uid}` document to link courierId and enable courierMode
    await userDocRef.update({
      courierId: uid,
      courierModeEnabled: true,
      updatedAt: nowIso,
    });

    // 7. Audit Log
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

    return NextResponse.json({
      success: true,
      courierId: uid,
      alreadyExisted: false,
    });

  } catch (error: any) {
    console.error('[API Activate Courier Profile Error]:', error);
    return NextResponse.json(
      { error: 'Error interno al activar perfil de repartidor.' },
      { status: 500 }
    );
  }
}
