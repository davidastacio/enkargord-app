import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { createClient } from "@supabase/supabase-js";

const required = [
  "FIREBASE_ADMIN_PROJECT_ID",
  "FIREBASE_ADMIN_CLIENT_EMAIL",
  "FIREBASE_ADMIN_PRIVATE_KEY",
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_SECRET_KEY",
];
for (const name of required) {
  if (!process.env[name]) throw new Error(`Missing environment variable: ${name}`);
}

let privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, "\n");
if (!privateKey.includes("\n") && privateKey.includes(" ")) {
  const header = "-----BEGIN PRIVATE KEY-----";
  const footer = "-----END PRIVATE KEY-----";
  if (privateKey.startsWith(header) && privateKey.endsWith(footer)) {
    const core = privateKey.slice(header.length, -footer.length).trim();
    privateKey = `${header}\n${core.replace(/\s+/g, "\n")}\n${footer}`;
  }
}
const firebase =
  getApps()[0] ||
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey,
    }),
  });
const firestore = getFirestore(firebase);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

const clean = (value) => {
  if (value === undefined) return null;
  if (Array.isArray(value)) return value.map(clean);
  if (value && typeof value === "object") {
    if (typeof value.toDate === "function") return value.toDate().toISOString();
    return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, clean(child)]));
  }
  return value;
};
const string = (value) => (typeof value === "string" ? value : "");
const number = (value, fallback = 0) => {
  const parsed = typeof value === "number" ? value : parseFloat(string(value));
  return Number.isFinite(parsed) ? parsed : fallback;
};
const iso = (value) => {
  if (typeof value === "string" && !Number.isNaN(Date.parse(value))) return value;
  if (value?.toDate) return value.toDate().toISOString();
  return new Date().toISOString();
};
const role = (value) => {
  const normalized = string(value).toLowerCase();
  if (normalized.includes("admin")) return "Admin";
  if (normalized.includes("tienda") || normalized.includes("store")) return "Tienda";
  if (normalized.includes("motor") || normalized.includes("courier")) return "Motorista";
  return "Cliente";
};
const memberRole = { Admin: "admin", Tienda: "store", Motorista: "courier", Cliente: "viewer" };

const { data: organization, error: organizationError } = await supabase
  .from("organizations")
  .select("id")
  .eq("slug", "enkargord")
  .single();
if (organizationError) throw organizationError;
const organizationId = organization.id;

const usersSnapshot = await firestore.collection("users").get();
const users = usersSnapshot.docs.map((document) => ({ id: document.id, ...clean(document.data()) }));
if (users.length) {
  const profiles = users.map((user) => ({
    firebase_uid: user.id,
    organization_id: organizationId,
    store_id: string(user.storeId) || null,
    courier_id: string(user.courierId) || null,
    name: string(user.name || user.fullName || user.displayName),
    email: string(user.email),
    phone: string(user.phone),
    role: role(user.role),
    status: user.status === "suspended" ? "suspended" : "active",
    courier_mode_enabled: Boolean(user.courierModeEnabled),
    metadata: user,
    created_at: iso(user.createdAt),
    updated_at: iso(user.updatedAt),
  }));
  const { error } = await supabase.from("user_profiles").upsert(profiles, {
    onConflict: "firebase_uid",
  });
  if (error) throw error;

  const memberships = profiles.map((profile) => ({
    organization_id: organizationId,
    firebase_uid: profile.firebase_uid,
    role: memberRole[profile.role],
    status: "active",
    updated_at: new Date().toISOString(),
  }));
  const { error: membershipError } = await supabase
    .from("organization_members")
    .upsert(memberships, { onConflict: "organization_id,firebase_uid" });
  if (membershipError) throw membershipError;
}

const profileIds = new Set(users.map((user) => user.id));
const storesSnapshot = await firestore.collection("stores").get();
const stores = storesSnapshot.docs.map((document) => ({ id: document.id, ...clean(document.data()) }));
if (stores.length) {
  const rows = stores.map((store) => ({
    id: store.id,
    organization_id: organizationId,
    owner_uid: profileIds.has(string(store.ownerUid)) ? string(store.ownerUid) : null,
    commercial_name: string(store.commercialName || store.name) || "Tienda",
    legal_name: string(store.legalName),
    email: string(store.email),
    phone: string(store.phone),
    address: string(store.address),
    status: ["pending", "active", "suspended", "inactive"].includes(store.status)
      ? store.status
      : "active",
    settings: store,
    created_at: iso(store.createdAt),
    updated_at: iso(store.updatedAt),
  }));
  const { error } = await supabase.from("stores").upsert(rows, { onConflict: "id" });
  if (error) throw error;
}

const storeIds = new Set(stores.map((store) => store.id));
const couriersSnapshot = await firestore.collection("couriers").get();
const couriers = couriersSnapshot.docs.map((document) => ({ id: document.id, ...clean(document.data()) }));
if (couriers.length) {
  const rows = couriers.map((courier) => ({
    id: courier.id,
    organization_id: organizationId,
    user_uid: profileIds.has(string(courier.userUid)) ? string(courier.userUid) : null,
    full_name: string(courier.fullName || courier.name) || "Motorista",
    email: string(courier.email),
    phone: string(courier.phone),
    operational_type: courier.operationalType === "admin_courier" ? "admin_courier" : "courier",
    vehicle_type: string(courier.vehicleType || courier.vehicle?.type),
    vehicle_plate: string(courier.vehiclePlate || courier.vehicle?.plate),
    vehicle_model: string(courier.vehicleModel || courier.vehicle?.model),
    vehicle_color: string(courier.vehicleColor || courier.vehicle?.color),
    status: ["available", "on_route", "offline", "suspended"].includes(courier.status)
      ? courier.status
      : "offline",
    active: courier.active !== false,
    current_order_count: Math.max(0, Math.trunc(number(courier.currentOrderCount))),
    completed_order_count: Math.max(0, Math.trunc(number(courier.completedOrderCount))),
    metadata: courier,
    created_at: iso(courier.createdAt),
    updated_at: iso(courier.updatedAt),
  }));
  const { error } = await supabase.from("couriers").upsert(rows, { onConflict: "id" });
  if (error) throw error;
}

const courierIds = new Set(couriers.map((courier) => courier.id));
const ordersSnapshot = await firestore.collection("orders").get();
const skippedOrders = [];
const orders = ordersSnapshot.docs.flatMap((document) => {
  const order = { id: document.id, ...clean(document.data()) };
  const tracking = string(order.tracking || order.id);
  if (!/^ENK-[0-9]{8}-[A-Z0-9]{5}$/.test(tracking)) {
    skippedOrders.push(tracking);
    return [];
  }
  const createdAt = iso(order.createdAt);
  return [{
    id: tracking,
    tracking,
    organization_id: organizationId,
    store_id: storeIds.has(string(order.storeId)) ? string(order.storeId) : null,
    created_by_uid: string(order.createdByUid) || "migration",
    courier_id: courierIds.has(string(order.courierId)) ? string(order.courierId) : null,
    courier_uid: string(order.courierUid) || null,
    courier_name: string(order.courierName),
    courier_type: string(order.courierType) || "courier",
    status: string(order.status) || "pending",
    customer_name: string(order.customerName || order.customer?.name) || "Cliente",
    customer_phone: string(order.customerPhone || order.customer?.phone),
    customer_email: string(order.customerEmail),
    province_name: string(order.provinceName),
    municipality_name: string(order.municipalityName),
    sector_name: string(order.sectorName),
    street: string(order.street || order.deliveryAddress?.addressLine),
    reference: string(order.reference),
    formatted_address: string(order.formattedAddress),
    location_verified: Boolean(order.locationVerified),
    package_type: string(order.packageType) || "Paquete",
    package_quantity: Math.max(1, Math.trunc(number(order.packageQuantity, 1))),
    package_description: string(order.packageDescription),
    requires_cash_on_delivery: Boolean(order.requiresCashOnDelivery),
    collection_amount: number(order.collectionAmount || order.financials?.productCost),
    shipping_cost: number(order.shippingCost || order.financials?.shippingCost),
    payment_method: string(order.paymentMethod) || "cash",
    requires_fulfillment: Boolean(order.requiresFulfillment),
    fulfillment_data: order.fulfillmentData || null,
    route_order: order.routeOrder == null ? null : Math.trunc(number(order.routeOrder)),
    settlement_status: string(order.settlementStatus) || "pending",
    metadata: order,
    created_at: createdAt,
    updated_at: iso(order.updatedAt || createdAt),
    delivered_at: order.deliveredAt ? iso(order.deliveredAt) : null,
  }];
});
if (orders.length) {
  const { error } = await supabase.from("orders").upsert(orders, { onConflict: "id" });
  if (error) throw error;
}

console.log(JSON.stringify({
  migrated: {
    users: users.length,
    stores: stores.length,
    couriers: couriers.length,
    orders: orders.length,
  },
  skippedOrders,
}, null, 2));
