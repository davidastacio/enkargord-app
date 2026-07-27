"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { auth } from "@/lib/firebase/client";

let browserClient: SupabaseClient | null = null;

export function getSupabaseBrowserClient(): SupabaseClient {
  if (browserClient) return browserClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    throw new Error("SUPABASE_PUBLIC_ENV_MISSING");
  }

  browserClient = createClient(url, publishableKey, {
    accessToken: async () => {
      return (await auth.currentUser?.getIdToken(false)) ?? null;
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

  return browserClient;
}

