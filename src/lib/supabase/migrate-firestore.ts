import "server-only";

import { createHash } from "node:crypto";

import { getAdminDb } from "@/lib/firebase/admin";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

type UnknownRecord = Record<string, unknown>;

const clean = (value: unknown): unknown => {
  if (value === undefined) return null;
  if (Array.isArray(value)) return value.map(clean);
  if (value && typeof value === "object") {
    if ("toDate" in value && typeof value.toDate === "function") {
      return value.toDate().toISOString();
    }
    return Object.fromEntries(
      Object.entries(value).map(([key, child]) => [key, clean(child)]),
    );
  }
  return value;
};

const stringValue = (value: unknown): string =>
  typeof value === "string" ? value : "";

const numberValue = (value: unknown, fallback = 0): number => {
  const parsed =
    typeof value === "number" ? value : parseFloat(stringValue(value));
  return Number.isFinite(parsed) ? parsed : fallback;
};

const dateValue = (value: unknown): string => {
  if (typeof value === "string" && !Number.isNaN(Date.parse(value))) return value;
  if (
    value &&
    typeof value === "object" &&
    "toDate" in value &&
    typeof value.toDate === "function"
  ) {
    return value.toDate().toISOString();
  }
  return new Date().toISOString();
};

type ProfileRole = keyof typeof organizationRole;

const profileRole = (value: unknown): ProfileRole => {
  const normalized = stringValue(value).toLowerCase();
  if (normalized.includes("admin")) return "Admin";
  if (normalized.includes("tienda") || normalized.includes("store")) return "Tienda";
  if (normalized.includes("motor") || normalized.includes("courier")) return "Motorista";
  return "Cliente";
};

const organizationRole = {
  Admin: "admin",
  Tienda: "store",
  Motorista: "courier",
  Cliente: "viewer",
} as const;

const validTracking = (value: string) =>
  /^ENK-[0-9]{8}-[A-Z0-9]{5}$/.test(value);

const migratedTracking = (legacyId: string, createdAt: string) => {
  const date = new Date(createdAt);
  const datePart = Number.isNaN(date.getTime())
    ? new Date().toISOString().slice(0, 10).replaceAll("-", "")
    : date.toISOString().slice(0, 10).replaceAll("-", "");
  const hash = createHash("sha256")
    .update(legacyId)
    .digest("hex")
    .slice(0, 5)
    .toUpperCase();
  return `ENK-${datePart}-${hash}`;
};

export async function migrateFirestoreToSupabase() {
  const firestore = getAdminDb();
  const supabase = getSupabaseAdminClient();
  const { data: organization, error: organizationError } = await supabase
    .from("organizations")
    .select("id")
    .eq("slug", "enkargord")
    .single();
  if (organizationError) throw organizationError;
  const organizationId = organization.id;

  const { data: previousMigration, error: previousMigrationError } = await supabase
    .from("audit_logs")
    .select("id")
    .eq("id", "MIG-FIRESTORE-V2")
    .maybeSingle();
  if (previousMigrationError) throw previousMigrationError;
  if (previousMigration) return { alreadyCompleted: true };

  const usersSnapshot = await firestore.collection("users").get();
  const users: Array<UnknownRecord & { id: string }> = usersSnapshot.docs.map((document) => ({
    id: document.id,
    ...(clean(document.data()) as UnknownRecord),
  }));
  const profiles = users.map((user) => {
    const role = profileRole(user.role);
    return {
      firebase_uid: user.id,
      organization_id: organizationId,
      store_id: stringValue(user.storeId) || null,
      courier_id: stringValue(user.courierId) || null,
      name: stringValue(user.name || user.fullName || user.displayName),
      email: stringValue(user.email),
      phone: stringValue(user.phone),
      role,
      status: user.status === "suspended" ? "suspended" : "active",
      courier_mode_enabled: Boolean(user.courierModeEnabled),
      metadata: user,
      created_at: dateValue(user.createdAt),
      updated_at: dateValue(user.updatedAt),
    };
  });
  if (profiles.length) {
    const { error } = await supabase
      .from("user_profiles")
      .upsert(profiles, { onConflict: "firebase_uid" });
    if (error) throw error;

    const { error: membershipError } = await supabase
      .from("organization_members")
      .upsert(
        profiles.map((profile) => ({
          organization_id: organizationId,
          firebase_uid: profile.firebase_uid,
          role: organizationRole[profile.role],
          status: "active",
          updated_at: new Date().toISOString(),
        })),
        { onConflict: "organization_id,firebase_uid" },
      );
    if (membershipError) throw membershipError;
  }

  const profileIds = new Set(users.map((user) => user.id));
  const storesSnapshot = await firestore.collection("stores").get();
  const stores: Array<UnknownRecord & { id: string }> = storesSnapshot.docs.map((document) => ({
    id: document.id,
    ...(clean(document.data()) as UnknownRecord),
  }));
  if (stores.length) {
    const { error } = await supabase.from("stores").upsert(
      stores.map((store) => ({
        id: store.id,
        organization_id: organizationId,
        owner_uid: profileIds.has(stringValue(store.ownerUid))
          ? stringValue(store.ownerUid)
          : null,
        commercial_name:
          stringValue(store.commercialName || store.name) || "Tienda",
        legal_name: stringValue(store.legalName),
        email: stringValue(store.email),
        phone: stringValue(store.phone),
        address: stringValue(store.address),
        status: ["pending", "active", "suspended", "inactive"].includes(
          stringValue(store.status),
        )
          ? store.status
          : "active",
        settings: store,
        created_at: dateValue(store.createdAt),
        updated_at: dateValue(store.updatedAt),
      })),
      { onConflict: "id" },
    );
    if (error) throw error;
  }

  const storeIds = new Set(stores.map((store) => store.id));
  const couriersSnapshot = await firestore.collection("couriers").get();
  const couriers: Array<UnknownRecord & { id: string }> = couriersSnapshot.docs.map((document) => ({
    id: document.id,
    ...(clean(document.data()) as UnknownRecord),
  }));
  if (couriers.length) {
    const { error } = await supabase.from("couriers").upsert(
      couriers.map((courier) => ({
        id: courier.id,
        organization_id: organizationId,
        user_uid: profileIds.has(stringValue(courier.userUid))
          ? stringValue(courier.userUid)
          : null,
        full_name:
          stringValue(courier.fullName || courier.name) || "Motorista",
        email: stringValue(courier.email),
        phone: stringValue(courier.phone),
        operational_type:
          courier.operationalType === "admin_courier"
            ? "admin_courier"
            : "courier",
        vehicle_type: stringValue(courier.vehicleType),
        vehicle_plate: stringValue(courier.vehiclePlate),
        vehicle_model: stringValue(courier.vehicleModel),
        vehicle_color: stringValue(courier.vehicleColor),
        status: ["available", "on_route", "offline", "suspended"].includes(
          stringValue(courier.status),
        )
          ? courier.status
          : "offline",
        active: courier.active !== false,
        current_order_count: Math.max(
          0,
          Math.trunc(numberValue(courier.currentOrderCount)),
        ),
        completed_order_count: Math.max(
          0,
          Math.trunc(numberValue(courier.completedOrderCount)),
        ),
        metadata: courier,
        created_at: dateValue(courier.createdAt),
        updated_at: dateValue(courier.updatedAt),
      })),
      { onConflict: "id" },
    );
    if (error) throw error;
  }

  const courierIds = new Set(couriers.map((courier) => courier.id));
  const ordersSnapshot = await firestore.collection("orders").get();
  const renamedLegacyOrders: Array<{ previous: string; current: string }> = [];
  const orders = ordersSnapshot.docs.flatMap((document) => {
    const order: UnknownRecord & { id: string } = {
      id: document.id,
      ...(clean(document.data()) as UnknownRecord),
    };
    const createdAt = dateValue(order.createdAt);
    const previousTracking = stringValue(order.tracking || order.id);
    const tracking = validTracking(previousTracking)
      ? previousTracking
      : migratedTracking(previousTracking, createdAt);
    if (tracking !== previousTracking) {
      renamedLegacyOrders.push({ previous: previousTracking, current: tracking });
    }
    const metadata = {
      ...order,
      ...(tracking !== previousTracking
        ? { legacyTracking: previousTracking }
        : {}),
    };
    return [{
      id: tracking,
      tracking,
      organization_id: organizationId,
      store_id: storeIds.has(stringValue(order.storeId))
        ? stringValue(order.storeId)
        : null,
      created_by_uid: stringValue(order.createdByUid) || "migration",
      courier_id: courierIds.has(stringValue(order.courierId))
        ? stringValue(order.courierId)
        : null,
      courier_uid: stringValue(order.courierUid) || null,
      courier_name: stringValue(order.courierName),
      courier_type: stringValue(order.courierType) || "courier",
      status: stringValue(order.status) || "pending",
      customer_name: stringValue(order.customerName) || "Cliente",
      customer_phone: stringValue(order.customerPhone),
      customer_email: stringValue(order.customerEmail),
      province_name: stringValue(order.provinceName),
      municipality_name: stringValue(order.municipalityName),
      sector_name: stringValue(order.sectorName),
      street: stringValue(order.street),
      reference: stringValue(order.reference),
      formatted_address: stringValue(order.formattedAddress),
      location_verified: Boolean(order.locationVerified),
      package_type: stringValue(order.packageType) || "Paquete",
      package_quantity: Math.max(
        1,
        Math.trunc(numberValue(order.packageQuantity, 1)),
      ),
      package_description: stringValue(order.packageDescription),
      requires_cash_on_delivery: Boolean(order.requiresCashOnDelivery),
      collection_amount: numberValue(order.collectionAmount),
      shipping_cost: numberValue(order.shippingCost),
      payment_method: stringValue(order.paymentMethod) || "cash",
      requires_fulfillment: Boolean(order.requiresFulfillment),
      fulfillment_data:
        order.fulfillmentData && typeof order.fulfillmentData === "object"
          ? order.fulfillmentData
          : null,
      route_order:
        order.routeOrder == null
          ? null
          : Math.trunc(numberValue(order.routeOrder)),
      settlement_status: stringValue(order.settlementStatus) || "pending",
      metadata,
      created_at: createdAt,
      updated_at: dateValue(order.updatedAt || createdAt),
      delivered_at: order.deliveredAt ? dateValue(order.deliveredAt) : null,
    }];
  });
  if (orders.length) {
    const { error } = await supabase
      .from("orders")
      .upsert(orders, { onConflict: "id" });
    if (error) throw error;
  }

  const summary = {
    users: users.length,
    stores: stores.length,
    couriers: couriers.length,
    orders: orders.length,
    renamedLegacyOrders,
  };
  const { error: markerError } = await supabase.from("audit_logs").insert({
    id: "MIG-FIRESTORE-V2",
    organization_id: organizationId,
    action: "migrate_firestore_to_supabase",
    actor_uid: "system",
    actor_role: "admin",
    target_type: "database",
    target_id: "supabase",
    metadata: summary,
    created_at: new Date().toISOString(),
  });
  if (markerError) throw markerError;
  return { alreadyCompleted: false, ...summary };
}
