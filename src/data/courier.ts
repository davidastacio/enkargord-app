/**
 * EnkargoRD - Courier Panel Data Models
 * Shared TypeScript interfaces for motorista, admin operational, and financial data.
 */

// ─────────────────────────────────────────────
// MOTORISTA / COURIER
// ─────────────────────────────────────────────

export type CourierStatus =
  | 'available'    // Disponible
  | 'on_route'     // En ruta
  | 'paused'       // Pausado
  | 'offline';     // Fuera de servicio

export interface VehicleInfo {
  type: 'motocicleta' | 'automovil' | 'bicicleta' | 'patineta' | 'pie' | string;
  plate: string;
  model?: string;
  color?: string;
  year?: number;
}

export interface Courier {
  id: string;
  name: string;
  cedula?: string;
  phone: string;
  email?: string;
  address?: string;
  photoUrl?: string;
  licenseNumber?: string;
  vehicle: VehicleInfo;
  assignedZone?: string;
  status: CourierStatus;
  commissionType: 'fixed' | 'percentage';
  commissionValue: number;         // Fixed RD$ amount or % number
  active: boolean;
  suspended: boolean;
  createdAt: string;               // ISO date
  /** Running total of cash currently in the courier's hands */
  cashInStreet: number;
}

// ─────────────────────────────────────────────
// FINANCIAL BENEFICIARIES & PRICING
// ─────────────────────────────────────────────

export type CalculationType = 'fixed' | 'percentage_of_shipping' | 'percentage_of_total';

export interface SettlementBeneficiary {
  id: string;
  name: string;                    // e.g. "Polanco", "Transportadora"
  calculationType: CalculationType;
  fixedAmount: number;             // Used when type is 'fixed'
  percentage: number;              // Used when type is 'percentage_*'
  active: boolean;
  description?: string;
}

export interface ZoneSurcharge {
  provinceId: string;
  provinceName: string;
  surcharge: number;               // Extra RD$ added to base shipping cost
}

export interface PricingSettings {
  id: string;
  baseShippingCost: number;        // Default delivery tariff (RD$)
  fulfillmentCosts: Record<string, number>; // key = packaging type, value = RD$
  zoneSurcharges: ZoneSurcharge[];
  beneficiaries: SettlementBeneficiary[];
  lastUpdated: string;
}

// ─────────────────────────────────────────────
// ORDER STATES & FULFILLMENT
// ─────────────────────────────────────────────

export type OrderStatus =
  | 'assigned'          // Asignado
  | 'picked_up'         // Recogido
  | 'on_route'          // En ruta
  | 'next_delivery'     // Próximo
  | 'no_answer'         // Cliente no contesta
  | 'rescheduled'       // Reprogramado
  | 'delivered'         // Entregado
  | 'failed_delivery'   // Entrega fallida
  | 'returned'          // Devuelto
  | 'pending_settlement'// Pendiente de liquidación
  | 'settled';          // Liquidado

export type PaymentMethod = 'cash' | 'card' | 'transfer' | 'mixed';
export type PackagingType =
  | 'sobre'
  | 'bolsa_seguridad'
  | 'caja_pequena'
  | 'caja_mediana'
  | 'caja_grande'
  | 'proteccion_adicional'
  | 'personalizado';

export type FulfillmentStatus =
  | 'pending_packaging'
  | 'in_preparation'
  | 'packaged'
  | 'ready_for_dispatch';

export interface FulfillmentRequest {
  required: boolean;
  packagingType?: PackagingType;
  approximateSize?: 'pequeno' | 'mediano' | 'grande';
  fragile?: boolean;
  weightKg?: number;
  packageCount?: number;
  protectionLevel?: 'standard' | 'bubble_wrap' | 'custom';
  logisticsNotes?: string;         // No commercial product info
  status?: FulfillmentStatus;
  additionalCost?: number;
}

// ─────────────────────────────────────────────
// NO-CONTACT INCIDENT
// ─────────────────────────────────────────────

export interface NoAnswerAttempt {
  attemptNumber: number;
  timestamp: string;               // ISO date
  notes?: string;
  channel: 'call' | 'whatsapp' | 'both';
}

export interface NoAnswerRecord {
  orderId: string;
  attempts: NoAnswerAttempt[];
  rescheduledTo?: string;          // ISO date
  returnedToStore?: boolean;
  incorrectAddress?: boolean;
}

// ─────────────────────────────────────────────
// COURIER ORDER (operational view for motorista)
// ─────────────────────────────────────────────

export interface OrderFinancials {
  /** Total amount the customer must pay */
  orderCollectionAmount: number;
  /** Cost of the delivery service */
  shippingCost: number;
  /** Amount that goes to the store */
  storeProductAmount: number;
  /** Commission for the courier */
  courierCommission: number;
  /** Amount for the transport company */
  transportCompanyAmount: number;
  /** Beneficiary breakdown (Polanco, etc.) */
  beneficiaryBreakdown: { beneficiaryId: string; name: string; amount: number }[];
  /** Fulfillment surcharge if any */
  fulfillmentCost: number;
}

export interface CourierOrder {
  id: string;
  trackingId: string;              // ENK-YYYYMMDD-XXXXX
  status: OrderStatus;
  courierId: string;
  courierName: string;
  storeId: string;
  storeName: string;
  createdAt: string;               // ISO date
  scheduledAt?: string;            // ISO date (if rescheduled)

  customer: {
    name: string;
    phone: string;                 // Normalized DR format
  };

  deliveryAddress: {
    provinceId: string;
    provinceName: string;
    municipalityId?: string;
    municipalityName?: string;
    districtId?: string;
    districtName?: string;
    sectorId?: string;
    sectorName?: string;
    street?: string;
    streetNumber?: string;
    fullAddress: string;
    reference?: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };

  financials: OrderFinancials;
  fulfillment: FulfillmentRequest;
  noAnswerRecord?: NoAnswerRecord;

  deliveredAt?: string;            // ISO date
  deliveryLocation?: { lat: number; lng: number };
  paymentMethod?: PaymentMethod;
  amountCollected?: number;
  deliveryProofUrl?: string;
  routeOrder?: number;             // Position in the day's route
}

// ─────────────────────────────────────────────
// COURIER LIVE LOCATION
// ─────────────────────────────────────────────

export interface LocationSnapshot {
  lat: number;
  lng: number;
  accuracy?: number;
  timestamp: string;
  orderId?: string;
  courierId: string;
}

export interface LiveRoute {
  courierId: string;
  active: boolean;
  startedAt?: string;
  lastUpdate?: string;
  currentLocation?: LocationSnapshot;
  trackingHistory: LocationSnapshot[];
}

// ─────────────────────────────────────────────
// LIQUIDATION / SETTLEMENT
// ─────────────────────────────────────────────

export type LiquidationStatus = 'pending' | 'submitted' | 'approved' | 'rejected' | 'paid';

export interface LiquidationEntry {
  orderId: string;
  trackingId: string;
  storeName: string;
  amountCollected: number;
  storeAmount: number;
  courierCommission: number;
  beneficiaryAmounts: { beneficiaryId: string; name: string; amount: number }[];
  shippingCost: number;
  fulfillmentCost: number;
  deliveredAt: string;
}

export interface Liquidation {
  id: string;
  courierId: string;
  courierName: string;
  status: LiquidationStatus;
  submittedAt?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  paidAt?: string;
  entries: LiquidationEntry[];

  // Aggregated totals
  totalCollected: number;
  totalForStores: number;
  totalCourierCommission: number;
  totalBeneficiaryAmounts: number;
  totalForCompany: number;
  totalCashToDeliver: number;      // What courier must hand to company

  adminNotes?: string;
  receiptUrl?: string;
}

// ─────────────────────────────────────────────
// WHATSAPP TEMPLATES
// ─────────────────────────────────────────────

export type WhatsAppTemplateKey =
  | 'on_the_way'
  | 'arriving_soon'
  | 'arrived'
  | 'no_answer'
  | 'rescheduled';

export interface WhatsAppTemplate {
  key: WhatsAppTemplateKey;
  label: string;
  template: string; // Use {{motorista}}, {{tienda}}, {{tracking}} as placeholders
}

export const DEFAULT_WHATSAPP_TEMPLATES: WhatsAppTemplate[] = [
  {
    key: 'on_the_way',
    label: 'Estoy en camino',
    template:
      'Hola, soy {{motorista}}, repartidor de EnkargoRD. Tengo una entrega de {{tienda}} con tracking {{tracking}}. Estoy en camino hacia su dirección. Por favor, confirme si está disponible para recibirla.',
  },
  {
    key: 'arriving_soon',
    label: 'Estoy cerca',
    template:
      'Hola, soy {{motorista}} de EnkargoRD. Su entrega de {{tienda}} (tracking {{tracking}}) llegará en pocos minutos. Por favor, esté disponible.',
  },
  {
    key: 'arrived',
    label: 'Llegué a la ubicación',
    template:
      'Hola, soy {{motorista}} de EnkargoRD. Llegué a la dirección indicada con su entrega de {{tienda}} (tracking {{tracking}}). Estoy esperando.',
  },
  {
    key: 'no_answer',
    label: 'No logro comunicarme',
    template:
      'Hola, soy {{motorista}} de EnkargoRD. Intenté contactarle para entregar su paquete de {{tienda}} (tracking {{tracking}}) pero no obtuve respuesta. Por favor, comuníquese para coordinar la entrega.',
  },
  {
    key: 'rescheduled',
    label: 'Entrega reprogramada',
    template:
      'Hola, su entrega de {{tienda}} (tracking {{tracking}}) ha sido reprogramada. Nos comunicaremos próximamente para coordinar una nueva fecha y hora de entrega.',
  },
];

// ─────────────────────────────────────────────
// UTILITY FUNCTIONS
// ─────────────────────────────────────────────

/** Normalize a Dominican Republic phone number for WhatsApp */
export function normalizeDRPhone(phone: string): string {
  // Remove all non-digit characters
  let digits = phone.replace(/\D/g, '');
  // Remove leading 0 if present
  if (digits.startsWith('0')) digits = digits.slice(1);
  // If 10 digits starting with 809, 829, 849 - it's a local DR number
  if (digits.length === 10) {
    return '1' + digits;
  }
  // If already starts with 1 and is 11 digits
  if (digits.startsWith('1') && digits.length === 11) {
    return digits;
  }
  // Already has country code
  return digits;
}

/** Build a WhatsApp deep-link from template + context */
export function buildWhatsAppUrl(
  phone: string,
  template: string,
  context: { motorista: string; tienda: string; tracking: string }
): string {
  const normalized = normalizeDRPhone(phone);
  const message = template
    .replace(/{{motorista}}/g, context.motorista)
    .replace(/{{tienda}}/g, context.tienda)
    .replace(/{{tracking}}/g, context.tracking);
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}

/** Generate a tracking ID in ENK-YYYYMMDD-XXXXX format */
export function generateTrackingId(sequenceNumber: number): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const seq = String(sequenceNumber).padStart(5, '0');
  return `ENK-${y}${m}${d}-${seq}`;
}

/** Calculate financial distribution for an order */
export function calculateOrderFinancials(
  orderCollectionAmount: number,
  shippingCost: number,
  fulfillmentCost: number,
  pricing: PricingSettings
): OrderFinancials {
  const storeProductAmount = orderCollectionAmount - shippingCost - fulfillmentCost;
  const beneficiaryBreakdown = pricing.beneficiaries
    .filter((b) => b.active)
    .map((b) => {
      let amount = 0;
      if (b.calculationType === 'fixed') {
        amount = b.fixedAmount;
      } else if (b.calculationType === 'percentage_of_shipping') {
        amount = (shippingCost * b.percentage) / 100;
      } else if (b.calculationType === 'percentage_of_total') {
        amount = (orderCollectionAmount * b.percentage) / 100;
      }
      return { beneficiaryId: b.id, name: b.name, amount };
    });

  const totalBeneficiaryAmount = beneficiaryBreakdown.reduce((s, b) => s + b.amount, 0);
  const courierCommission = shippingCost - totalBeneficiaryAmount - fulfillmentCost;
  const transportCompanyAmount = totalBeneficiaryAmount + fulfillmentCost;

  return {
    orderCollectionAmount,
    shippingCost,
    storeProductAmount: Math.max(0, storeProductAmount),
    courierCommission: Math.max(0, courierCommission),
    transportCompanyAmount: Math.max(0, transportCompanyAmount),
    beneficiaryBreakdown,
    fulfillmentCost,
  };
}

// ─────────────────────────────────────────────
// DEFAULT / INITIAL DATA
// ─────────────────────────────────────────────

export const DEFAULT_PRICING: PricingSettings = {
  id: 'default',
  baseShippingCost: 200,
  fulfillmentCosts: {
    sobre: 30,
    bolsa_seguridad: 40,
    caja_pequena: 50,
    caja_mediana: 70,
    caja_grande: 100,
    proteccion_adicional: 60,
    personalizado: 80,
  },
  zoneSurcharges: [],
  beneficiaries: [
    {
      id: 'polanco',
      name: 'Polanco',
      calculationType: 'fixed',
      fixedAmount: 50,
      percentage: 0,
      active: true,
      description: 'Comisión fija por entrega',
    },
  ],
  lastUpdated: new Date().toISOString(),
};

export const DEFAULT_COURIERS: Courier[] = [
  {
    id: 'COU-001',
    name: 'Carlos Martínez',
    cedula: '001-0000001-1',
    phone: '8095551111',
    email: 'carlos@enkargord.com',
    vehicle: { type: 'motocicleta', plate: 'K-123456', model: 'Honda CB125', color: 'Rojo' },
    assignedZone: 'Santo Domingo Este',
    status: 'available',
    commissionType: 'fixed',
    commissionValue: 100,
    active: true,
    suspended: false,
    createdAt: '2026-01-10T00:00:00Z',
    cashInStreet: 0,
  },
  {
    id: 'COU-002',
    name: 'Luis Arias',
    cedula: '001-0000002-2',
    phone: '8295552222',
    email: 'luis@enkargord.com',
    vehicle: { type: 'motocicleta', plate: 'K-654321', model: 'Yamaha YBR125', color: 'Azul' },
    assignedZone: 'Santo Domingo Norte',
    status: 'on_route',
    commissionType: 'fixed',
    commissionValue: 100,
    active: true,
    suspended: false,
    createdAt: '2026-02-05T00:00:00Z',
    cashInStreet: 3800,
  },
  {
    id: 'COU-003',
    name: 'Yoselin Vargas',
    cedula: '001-0000003-3',
    phone: '8495553333',
    email: 'yoselin@enkargord.com',
    vehicle: { type: 'motocicleta', plate: 'K-987654', model: 'Yamaha FZ', color: 'Negro' },
    assignedZone: 'Distrito Nacional',
    status: 'on_route',
    commissionType: 'fixed',
    commissionValue: 100,
    active: true,
    suspended: false,
    createdAt: '2026-03-01T00:00:00Z',
    cashInStreet: 2450,
  },
];

export const DEFAULT_ORDERS: CourierOrder[] = [
  {
    id: 'ENK-20260720-00001',
    trackingId: 'ENK-20260720-00001',
    status: 'on_route',
    courierId: 'COU-001',
    courierName: 'Carlos Martínez',
    storeId: 'STORE-01',
    storeName: 'Moda Express RD',
    createdAt: '2026-07-20T08:00:00Z',
    customer: { name: 'Juan Pérez', phone: '8095551234' },
    deliveryAddress: {
      provinceId: 'DN',
      provinceName: 'Distrito Nacional',
      municipalityId: 'DN-01',
      municipalityName: 'Santo Domingo de Guzmán',
      sectorName: 'Naco',
      street: 'Av. Churchill',
      streetNumber: '12',
      fullAddress: 'Av. Churchill #12, Naco, Distrito Nacional',
      reference: 'Frente al parque',
      coordinates: { lat: 18.4795, lng: -69.9326 },
    },
    financials: {
      orderCollectionAmount: 2090,
      shippingCost: 250,
      storeProductAmount: 1800,
      courierCommission: 200,
      transportCompanyAmount: 90,
      beneficiaryBreakdown: [{ beneficiaryId: 'polanco', name: 'Polanco', amount: 50 }],
      fulfillmentCost: 40,
    },
    fulfillment: {
      required: true,
      packagingType: 'bolsa_seguridad',
      status: 'packaged',
      additionalCost: 40,
    },
    routeOrder: 1,
  },
  {
    id: 'ENK-20260720-00002',
    trackingId: 'ENK-20260720-00002',
    status: 'assigned',
    courierId: 'COU-001',
    courierName: 'Carlos Martínez',
    storeId: 'STORE-01',
    storeName: 'Moda Express RD',
    createdAt: '2026-07-20T08:15:00Z',
    customer: { name: 'María García', phone: '8295554321' },
    deliveryAddress: {
      provinceId: 'SD',
      provinceName: 'Santo Domingo',
      municipalityId: 'SD-01',
      municipalityName: 'Santo Domingo Este',
      sectorName: 'Los Mina',
      street: 'Av. Venezuela',
      fullAddress: 'Av. Venezuela, Los Mina, Santo Domingo Este',
      coordinates: { lat: 18.4872, lng: -69.8680 },
    },
    financials: {
      orderCollectionAmount: 1500,
      shippingCost: 200,
      storeProductAmount: 1260,
      courierCommission: 150,
      transportCompanyAmount: 90,
      beneficiaryBreakdown: [{ beneficiaryId: 'polanco', name: 'Polanco', amount: 50 }],
      fulfillmentCost: 40,
    },
    fulfillment: {
      required: true,
      packagingType: 'sobre',
      status: 'ready_for_dispatch',
      additionalCost: 40,
    },
    routeOrder: 2,
  },
  {
    id: 'ENK-20260720-00003',
    trackingId: 'ENK-20260720-00003',
    status: 'no_answer',
    courierId: 'COU-001',
    courierName: 'Carlos Martínez',
    storeId: 'STORE-02',
    storeName: 'Tech Gadgets RD',
    createdAt: '2026-07-20T07:30:00Z',
    customer: { name: 'Pedro Sánchez', phone: '8495557890' },
    deliveryAddress: {
      provinceId: 'SJ',
      provinceName: 'San Juan',
      municipalityId: 'SJ-01',
      municipalityName: 'San Juan de la Maguana',
      fullAddress: 'Calle Independencia #45, San Juan de la Maguana',
      coordinates: { lat: 18.8058, lng: -71.2287 },
    },
    financials: {
      orderCollectionAmount: 3200,
      shippingCost: 350,
      storeProductAmount: 2800,
      courierCommission: 300,
      transportCompanyAmount: 100,
      beneficiaryBreakdown: [{ beneficiaryId: 'polanco', name: 'Polanco', amount: 50 }],
      fulfillmentCost: 50,
    },
    fulfillment: { required: false },
    noAnswerRecord: {
      orderId: 'ENK-20260720-00003',
      attempts: [
        { attemptNumber: 1, timestamp: '2026-07-20T09:00:00Z', channel: 'call', notes: 'No contestó' },
        { attemptNumber: 2, timestamp: '2026-07-20T10:30:00Z', channel: 'whatsapp', notes: 'Mensaje enviado' },
      ],
    },
    routeOrder: 3,
  },
  {
    id: 'ENK-20260720-00004',
    trackingId: 'ENK-20260720-00004',
    status: 'delivered',
    courierId: 'COU-001',
    courierName: 'Carlos Martínez',
    storeId: 'STORE-01',
    storeName: 'Moda Express RD',
    createdAt: '2026-07-20T07:00:00Z',
    deliveredAt: '2026-07-20T09:45:00Z',
    amountCollected: 1800,
    paymentMethod: 'cash',
    customer: { name: 'Ana Jiménez', phone: '8095558765' },
    deliveryAddress: {
      provinceId: 'DN',
      provinceName: 'Distrito Nacional',
      municipalityId: 'DN-01',
      municipalityName: 'Santo Domingo de Guzmán',
      sectorName: 'Gazcue',
      street: 'Calle Dr. Báez',
      fullAddress: 'Calle Dr. Báez, Gazcue, Distrito Nacional',
      coordinates: { lat: 18.4667, lng: -69.9167 },
    },
    financials: {
      orderCollectionAmount: 1800,
      shippingCost: 200,
      storeProductAmount: 1550,
      courierCommission: 150,
      transportCompanyAmount: 100,
      beneficiaryBreakdown: [{ beneficiaryId: 'polanco', name: 'Polanco', amount: 50 }],
      fulfillmentCost: 50,
    },
    fulfillment: {
      required: true,
      packagingType: 'caja_pequena',
      status: 'packaged',
      additionalCost: 50,
    },
    routeOrder: 0,
  },
];
