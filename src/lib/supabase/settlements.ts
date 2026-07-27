"use client";

import type { Liquidation } from "@/data/courier";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export async function listCourierSettlements(courierId: string): Promise<Liquidation[]> {
  const { data, error } = await getSupabaseBrowserClient()
    .from("settlements")
    .select("*")
    .eq("courier_id", courierId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => ({
    ...(row.metadata ?? {}),
    id: row.id,
    courierId: row.courier_id,
    status: row.status,
    submittedAt: row.created_at,
    paidAt: row.paid_at || undefined,
    totalCollected: Number(row.gross_amount),
    totalCourierCommission: Number(row.commission_amount),
    totalCashToDeliver: Number(row.net_amount),
  })) as Liquidation[];
}
