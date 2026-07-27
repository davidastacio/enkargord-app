"use client";

import { auth } from "@/lib/firebase/client";
export async function getOperationSettings<T>(): Promise<T | null> {
  const user = auth.currentUser;
  if (!user) throw new Error("UNAUTHENTICATED");
  const response = await fetch("/api/operations/settings", {
    headers: { Authorization: `Bearer ${await user.getIdToken()}` },
    cache: "no-store",
  });
  if (!response.ok) throw new Error("SETTINGS_READ_FAILED");
  const data = (await response.json()) as { settings?: T | null };
  return data.settings ?? null;
}

export async function saveOperationSettings(
  operationSettings: Record<string, unknown>,
): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error("UNAUTHENTICATED");
  const response = await fetch("/api/operations/settings", {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${await user.getIdToken()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ settings: operationSettings }),
  });
  if (!response.ok) throw new Error("SETTINGS_SAVE_FAILED");
}
