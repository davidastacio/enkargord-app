"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export interface AdminUserProfile {
  id: string;
  name: string;
  displayName: string;
  email: string;
  phone: string;
  role: "admin" | "store" | "courier" | "customer" | "collaborator";
  status: "active" | "pending" | "suspended" | "inactive";
  createdAt: string;
  lastLoginAt: string;
  storeId: string;
  storeName: string;
  courierId: string;
  disabled: boolean;
}

type ProfileRow = {
  firebase_uid: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  role: "Admin" | "Tienda" | "Motorista" | "Cliente" | "Colaborador";
  status: AdminUserProfile["status"];
  store_id: string | null;
  courier_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

const ROLE_MAP: Record<ProfileRow["role"], AdminUserProfile["role"]> = {
  Admin: "admin",
  Tienda: "store",
  Motorista: "courier",
  Cliente: "customer",
  Colaborador: "collaborator",
};

function mapProfile(row: ProfileRow): AdminUserProfile {
  const metadata = row.metadata ?? {};
  const name = row.name ?? "";
  const isCollab = metadata.isCollaborator === true || metadata.subRole === "Colaborador" || row.role === "Colaborador";
  return {
    id: row.firebase_uid,
    name,
    displayName: name,
    email: row.email ?? "",
    phone: row.phone ?? "",
    role: isCollab ? "collaborator" : (ROLE_MAP[row.role] || "store"),
    status: row.status,
    createdAt: row.created_at,
    lastLoginAt: typeof metadata.lastLoginAt === "string" ? metadata.lastLoginAt : "",
    storeId: row.store_id ?? "",
    storeName: typeof metadata.storeName === "string" ? metadata.storeName : "",
    courierId: row.courier_id ?? "",
    disabled: row.status === "suspended" || row.status === "inactive",
  };
}

export async function listAdminUserProfiles(): Promise<AdminUserProfile[]> {
  const { data, error } = await getSupabaseBrowserClient()
    .from("user_profiles")
    .select("firebase_uid,name,email,phone,role,status,store_id,courier_id,metadata,created_at")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return ((data ?? []) as ProfileRow[]).map(mapProfile);
}

export function subscribeAdminUserProfiles(onChange: () => void): () => void {
  const client = getSupabaseBrowserClient();
  const channel = client
    .channel(`admin-user-profiles-${crypto.randomUUID()}`)
    .on("postgres_changes", { event: "*", schema: "public", table: "user_profiles" }, onChange)
    .subscribe();

  return () => {
    void client.removeChannel(channel);
  };
}

export async function updateCurrentUserProfile(
  idToken: string,
  payload: {
    name?: string;
    phone?: string;
    email?: string;
    role?: "Cliente" | "Tienda" | "Motorista" | "Admin";
    storeId?: string | null;
  }
) {
  const response = await fetch('/api/auth/supabase-profile', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${idToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || 'PROFILE_UPDATE_FAILED');
  }
  return await response.json();
}
