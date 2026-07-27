"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export type CourierStatus = "available" | "on_route" | "paused" | "offline" | "suspended";

export interface CourierRecord {
  id: string;
  userUid: string;
  name: string;
  cedula: string;
  phone: string;
  email: string;
  address: string;
  licenseNumber: string;
  vehicle: { type: string; plate: string };
  assignedZone: string;
  status: CourierStatus;
  active: boolean;
  createdAt: string;
  lastActiveAt: string;
  cashInStreet: number;
  activeOrderCount: number;
  completedOrderCount: number;
  commissionType: string;
  commissionValue: number;
}

type CourierRow = {
  id: string;
  user_uid: string | null;
  full_name: string;
  email: string;
  phone: string;
  vehicle_type: string;
  vehicle_plate: string;
  status: Exclude<CourierStatus, "paused">;
  active: boolean;
  current_order_count: number;
  completed_order_count: number;
  commission_type: string;
  commission_value: number | string;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

function text(metadata: Record<string, unknown>, key: string): string {
  return typeof metadata[key] === "string" ? metadata[key] : "";
}

function mapCourier(row: CourierRow): CourierRecord {
  const metadata = row.metadata ?? {};
  return {
    id: row.id,
    userUid: row.user_uid ?? "",
    name: row.full_name,
    cedula: text(metadata, "identificationNumber"),
    phone: row.phone,
    email: row.email,
    address: text(metadata, "address"),
    licenseNumber: text(metadata, "licenseNumber"),
    vehicle: { type: row.vehicle_type || "motocicleta", plate: row.vehicle_plate || "—" },
    assignedZone: text(metadata, "assignedZone") || "—",
    status: row.status,
    active: row.active,
    createdAt: row.created_at,
    lastActiveAt: row.updated_at,
    cashInStreet: Number(metadata.cashInStreet ?? 0),
    activeOrderCount: row.current_order_count,
    completedOrderCount: row.completed_order_count,
    commissionType: row.commission_type,
    commissionValue: Number(row.commission_value),
  };
}

export async function listCouriers(): Promise<CourierRecord[]> {
  const { data, error } = await getSupabaseBrowserClient()
    .from("couriers")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return ((data ?? []) as CourierRow[]).map(mapCourier);
}

export function subscribeCouriers(onChange: () => void): () => void {
  const client = getSupabaseBrowserClient();
  const channel = client
    .channel(`admin-couriers-${crypto.randomUUID()}`)
    .on("postgres_changes", { event: "*", schema: "public", table: "couriers" }, onChange)
    .subscribe();
  return () => {
    void client.removeChannel(channel);
  };
}

export async function updateCourier(
  id: string,
  input: {
    fullName: string;
    email: string;
    phone: string;
    vehicleType: string;
    vehiclePlate: string;
    status?: CourierStatus;
    active?: boolean;
    commissionType?: string;
    commissionValue?: number;
    metadata?: Record<string, unknown>;
  },
): Promise<void> {
  const client = getSupabaseBrowserClient();
  let metadata = input.metadata;
  if (metadata) {
    const current = await client.from("couriers").select("metadata").eq("id", id).single();
    if (current.error) throw current.error;
    metadata = { ...(current.data?.metadata ?? {}), ...metadata };
  }

  const status = input.status === "paused" ? "offline" : input.status;
  const { error } = await client
    .from("couriers")
    .update({
      full_name: input.fullName,
      email: input.email,
      phone: input.phone,
      vehicle_type: input.vehicleType,
      vehicle_plate: input.vehiclePlate,
      ...(status ? { status } : {}),
      ...(input.active !== undefined ? { active: input.active } : {}),
      ...(input.commissionType ? { commission_type: input.commissionType } : {}),
      ...(input.commissionValue !== undefined ? { commission_value: input.commissionValue } : {}),
      ...(metadata ? { metadata } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw error;
}

export async function adjustCourierOrderCount(
  id: string,
  delta: number,
  status?: "available" | "on_route" | "offline" | "suspended",
): Promise<void> {
  const client = getSupabaseBrowserClient();
  const { data, error: readError } = await client
    .from("couriers")
    .select("current_order_count")
    .eq("id", id)
    .single();
  if (readError) throw readError;
  const nextCount = Math.max(0, Number(data.current_order_count ?? 0) + delta);
  const { error } = await client
    .from("couriers")
    .update({
      current_order_count: nextCount,
      ...(status ? { status } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw error;
}

export async function createFleetCourier(input: {
  id: string;
  name: string;
  phone: string;
  vehicleType: string;
  vehiclePlate: string;
}): Promise<void> {
  const client = getSupabaseBrowserClient();
  const { data: organization, error: organizationError } = await client
    .from("organizations")
    .select("id")
    .eq("slug", "enkargord")
    .single();
  if (organizationError) throw organizationError;
  const now = new Date().toISOString();
  const { error } = await client.from("couriers").insert({
    id: input.id,
    organization_id: organization.id,
    user_uid: null,
    full_name: input.name,
    email: "",
    phone: input.phone,
    operational_type: "courier",
    vehicle_type: input.vehicleType,
    vehicle_plate: input.vehiclePlate,
    status: "available",
    active: true,
    current_order_count: 0,
    completed_order_count: 0,
    metadata: {},
    created_at: now,
    updated_at: now,
  });
  if (error) throw error;
}

export async function deactivateCourier(id: string): Promise<void> {
  const { error } = await getSupabaseBrowserClient()
    .from("couriers")
    .update({ active: false, status: "suspended", updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}
