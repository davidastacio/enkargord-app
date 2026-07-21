import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';

export async function POST(request: Request) {
  try {
    if (!adminAuth || !adminDb) {
      return NextResponse.json(
        { error: 'Firebase Admin SDK not initialized' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const {
      fullName,
      email,
      phone,
      identificationNumber,
      password,
      vehicleType,
      vehicleBrand,
      vehicleModel,
      vehicleColor,
      vehiclePlate,
      assignedProvinceId,
      assignedProvinceName,
      assignedMunicipalityId,
      assignedMunicipalityName,
      assignedZone,
      createdByUid,
    } = body;

    if (!fullName || !email || !phone || !password) {
      return NextResponse.json(
        { error: 'Faltan campos obligatorios (nombre, correo, teléfono o contraseña).' },
        { status: 400 }
      );
    }

    // 1. Create User in Firebase Authentication
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName: fullName,
      phoneNumber: phone.startsWith('+') ? phone : `+1${phone.replace(/\D/g, '')}`, // Formato dominicano o internacional
    });

    const uid = userRecord.uid;
    const courierId = `COU-${Date.now()}`;

    // 2. Set Custom User Claims for role
    await adminAuth.setCustomUserClaims(uid, { role: 'courier' });

    // 3. Create document in users/{uid}
    await adminDb.collection('users').doc(uid).set({
      uid,
      fullName,
      email,
      phone,
      role: 'courier',
      courierId: courierId,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // 4. Create document in couriers/{courierId}
    const newCourier = {
      id: courierId,
      userUid: uid,
      fullName,
      email,
      phone,
      identificationNumber: identificationNumber || '',
      vehicleType: vehicleType || 'motorcycle',
      vehicleBrand: vehicleBrand || '',
      vehicleModel: vehicleModel || '',
      vehicleColor: vehicleColor || '',
      vehiclePlate: vehiclePlate || '',
      assignedProvinceId: assignedProvinceId || '',
      assignedProvinceName: assignedProvinceName || '',
      assignedMunicipalityId: assignedMunicipalityId || '',
      assignedMunicipalityName: assignedMunicipalityName || '',
      assignedZone: assignedZone || '',
      status: 'available',
      active: true,
      currentOrderCount: 0,
      completedOrderCount: 0,
      createdByUid: createdByUid || 'ADMIN',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await adminDb.collection('couriers').doc(courierId).set(newCourier);

    // 5. Create Audit Log
    const auditId = `AUD-${Date.now()}`;
    await adminDb.collection('audit_logs').doc(auditId).set({
      id: auditId,
      action: 'create_courier',
      actorUid: createdByUid || 'ADMIN',
      actorRole: 'admin',
      targetType: 'courier',
      targetId: courierId,
      metadata: { fullName, email, vehiclePlate },
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      uid,
      courierId,
      temporaryPassword: password,
    });
  } catch (error: any) {
    console.error('Error creating courier via API:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor.' },
      { status: 500 }
    );
  }
}
