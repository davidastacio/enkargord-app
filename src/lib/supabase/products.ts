"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export interface StoreProductItem {
  id: string;
  name: string;
  price: number;
  updatedAt: string;
}

/** Get list of saved products for a store from localStorage & Supabase */
export async function getStoreProducts(storeId: string): Promise<StoreProductItem[]> {
  if (!storeId) return [];

  // 1. Try reading from local storage cache first
  const cacheKey = `enkargord_store_products_${storeId}`;
  const localCache = typeof window !== 'undefined' ? localStorage.getItem(cacheKey) : null;
  let products: StoreProductItem[] = localCache ? JSON.parse(localCache) : [];

  // 2. Fetch latest from Supabase store settings if available
  try {
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase
      .from("stores")
      .select("settings")
      .eq("id", storeId)
      .maybeSingle();

    if (!error && data?.settings?.catalog && Array.isArray(data.settings.catalog)) {
      products = data.settings.catalog as StoreProductItem[];
      if (typeof window !== 'undefined') {
        localStorage.setItem(cacheKey, JSON.stringify(products));
      }
    }
  } catch (err) {
    console.error("Error reading store catalog from Supabase:", err);
  }

  return products;
}

/** Save or update a product in a store's catalog */
export async function saveStoreProduct(
  storeId: string,
  product: { name: string; price: number }
): Promise<void> {
  if (!storeId || !product.name.trim()) return;

  const normalizedName = product.name.trim();
  const priceValue = Math.max(0, product.price || 0);
  const cacheKey = `enkargord_store_products_${storeId}`;

  // Get current products
  const currentProducts = await getStoreProducts(storeId);
  const existingIndex = currentProducts.findIndex(
    p => p.name.toLowerCase() === normalizedName.toLowerCase()
  );

  const now = new Date().toISOString();
  let updatedProducts: StoreProductItem[];

  if (existingIndex >= 0) {
    updatedProducts = [...currentProducts];
    updatedProducts[existingIndex] = {
      ...updatedProducts[existingIndex],
      price: priceValue,
      updatedAt: now
    };
  } else {
    const newItem: StoreProductItem = {
      id: `prod_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: normalizedName,
      price: priceValue,
      updatedAt: now
    };
    updatedProducts = [newItem, ...currentProducts];
  }

  // 1. Update localStorage cache
  if (typeof window !== 'undefined') {
    localStorage.setItem(cacheKey, JSON.stringify(updatedProducts));
  }

  // 2. Update Supabase store settings
  try {
    const supabase = getSupabaseBrowserClient();
    const { data: currentStore } = await supabase
      .from("stores")
      .select("settings")
      .eq("id", storeId)
      .maybeSingle();

    const existingSettings = currentStore?.settings || {};
    await supabase
      .from("stores")
      .update({
        settings: {
          ...existingSettings,
          catalog: updatedProducts
        },
        updated_at: now
      })
      .eq("id", storeId);
  } catch (err) {
    console.error("Error saving store product catalog to Supabase:", err);
  }
}
