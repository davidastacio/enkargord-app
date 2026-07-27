"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { auth } from "@/lib/firebase/client";

export type StoreProfile = {
  id: string;
  commercialName: string;
  legalName: string;
  email: string;
  phone: string;
  address: string;
  status: string;
  settings: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export async function getSupabaseStore(
  storeId: string,
): Promise<StoreProfile | null> {
  const { data, error } = await getSupabaseBrowserClient()
    .from("stores")
    .select("*")
    .eq("id", storeId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    id: data.id,
    commercialName: data.commercial_name,
    legalName: data.legal_name,
    email: data.email,
    phone: data.phone,
    address: data.address,
    status: data.status,
    settings: data.settings || {},
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

export async function updateSupabaseStore(
  storeId: string,
  patch: Partial<StoreProfile>,
): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error("UNAUTHENTICATED");
  const response = await fetch("/api/store/settings", {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${await user.getIdToken()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ storeId, patch }),
  });
  if (!response.ok) throw new Error("STORE_SETTINGS_UPDATE_FAILED");
}

export async function listSupabaseStoreNames(): Promise<Record<string, string>> {
  const client = getSupabaseBrowserClient();
  const map: Record<string, string> = {};

  // 1. Fetch from stores table
  const { data: stores } = await client
    .from("stores")
    .select("id,commercial_name,owner_uid");
  for (const s of stores ?? []) {
    if (s.id) map[s.id] = s.commercial_name || "Tienda";
    if (s.owner_uid) map[s.owner_uid] = s.commercial_name || "Tienda";
  }

  // 2. Fetch from user_profiles table for stores and collaborators
  const { data: profiles } = await client
    .from("user_profiles")
    .select("firebase_uid,store_id,name,role");
  for (const p of profiles ?? []) {
    if (p.name) {
      if (p.firebase_uid) map[p.firebase_uid] = p.name;
      if (p.store_id && !map[p.store_id]) map[p.store_id] = p.name;
    }
  }

  return map;
}
