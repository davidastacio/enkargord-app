"use client";

import React from 'react';
import { MessageCircle } from 'lucide-react';
import { doc, addDoc, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { useAuth } from '@/hooks/useAuth';

export function normalizeDominicanPhone(phone: string): string {
  // 1. Remove all non-numeric characters except maybe leading characters (spaces, dashes, parens, plus)
  let clean = phone.replace(/[\s\-\(\)\+]/g, '');

  // 2. If it has 10 digits, prefix with '1' (Dominican Republic country calling code prefix for NANP)
  if (clean.length === 10) {
    const areaCode = clean.substring(0, 3);
    if (['809', '829', '849'].includes(areaCode)) {
      clean = '1' + clean;
    }
  }

  return clean;
}

interface WhatsAppContactButtonProps {
  phone: string;
  orderId: string;
  storeName: string;
  trackingId?: string;     // legacy prop name
  tracking?: string;       // alias
  customerName?: string;
  courierId?: string;
  templateKey?: 'in_transit' | 'close' | 'arrived' | 'no_contact' | 'rescheduled';
  className?: string;
  label?: string;
}

const TEMPLATES = {
  in_transit: "Hola, soy {motorista}, repartidor de EnkargoRD. Tengo una entrega de {tienda} con tracking {tracking}. Estoy en ruta hacia su dirección. Por favor, confirme si está disponible para recibirla.",
  close: "Hola, le escribe {motorista} de EnkargoRD. Estoy muy cerca de su ubicación para realizar la entrega de {tienda} ({tracking}).",
  arrived: "Hola, soy {motorista} de EnkargoRD. Acabo de llegar a la ubicación de entrega de {tienda}. Estoy afuera.",
  no_contact: "Estimado cliente, le escribe {motorista} de EnkargoRD. He intentado comunicarme con usted para entregar su pedido de {tienda} ({tracking}) pero no he tenido éxito. Por favor confirme disponibilidad.",
  rescheduled: "Hola, le escribe {motorista} de EnkargoRD. Su entrega de {tienda} ({tracking}) ha sido reprogramada para una nueva visita. Nos mantendremos en contacto."
};

export default function WhatsAppContactButton({
  phone,
  orderId,
  storeName,
  trackingId,
  tracking,
  templateKey = 'in_transit',
  className,
  label
}: WhatsAppContactButtonProps) {
  const { profile } = useAuth() as any;

  const handleOpenWhatsApp = async () => {
    try {
      const motoristaName = profile?.fullName || 'Motorista de EnkargoRD';
      const templateText = TEMPLATES[templateKey] || TEMPLATES.in_transit;
      
      const resolvedTracking = trackingId || tracking || orderId;
      const message = templateText
        .replace('{motorista}', motoristaName)
        .replace('{tienda}', storeName)
        .replace('{tracking}', resolvedTracking);

      const normalizedPhone = normalizeDominicanPhone(phone);
      const encodedText = encodeURIComponent(message);
      const waUrl = `https://wa.me/${normalizedPhone}?text=${encodedText}`;

      // Log the event in Firestore
      await addDoc(collection(db, 'orders', orderId, 'events'), {
        type: 'customer_whatsapp_opened',
        previousStatus: 'unknown',
        newStatus: 'unknown',
        actorUid: profile?.uid || 'UNKNOWN',
        actorRole: 'courier',
        courierId: profile?.courierId || '',
        note: `Se abrió WhatsApp con la plantilla: ${templateKey}`,
        createdAt: new Date().toISOString()
      });

      // Open in a new tab
      window.open(waUrl, '_blank', 'noopener,noreferrer');
    } catch (error) {
      console.error("Error logging WhatsApp contact event:", error);
      // Fallback open whatsapp anyway
      const normalizedPhone = normalizeDominicanPhone(phone);
      window.open(`https://wa.me/${normalizedPhone}`, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <button
      onClick={handleOpenWhatsApp}
      className={className || "flex items-center justify-center gap-1.5 py-2.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-700 transition-all w-full"}
    >
      <MessageCircle size={13} />
      {label || 'WhatsApp'}
    </button>
  );
}
