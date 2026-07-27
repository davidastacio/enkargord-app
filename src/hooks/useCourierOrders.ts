"use client";

import { useEffect, useState } from "react";
import type { CourierOrder } from "@/data/courier";
import { useAuth } from "@/hooks/useAuth";
import { toCourierOrder } from "@/lib/supabase/courier-orders";
import { subscribeSupabaseOrders } from "@/lib/supabase/orders";

export function useCourierOrders() {
  const { profile } = useAuth();
  const [orders, setOrders] = useState<CourierOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const courierId = profile?.courierId || "";

  useEffect(() => {
    if (!courierId) {
      setOrders([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    return subscribeSupabaseOrders(
      { courierId },
      (rows) => {
        setOrders(rows.map((row) => toCourierOrder(row)));
        setLoading(false);
      },
      (error) => {
        console.error("Error loading courier orders:", error);
        setOrders([]);
        setLoading(false);
      },
    );
  }, [courierId]);

  return { orders, setOrders, loading, courierId, profile };
}
