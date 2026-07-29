"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import RouteGuard from "@/components/auth/RouteGuard";
import UndeliveredOrdersModule from "@/components/orders/UndeliveredOrdersModule";

export default function AdminUndeliveredOrdersPage() {
  return (
    <RouteGuard allowedRoles={["Admin"]}>
      <main className="min-h-screen bg-[#F8F9FB] p-4 text-slate-800 sm:p-6 lg:p-10">
        <div className="mx-auto max-w-6xl space-y-6">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 rounded-xl border border-[#E7E7EC] bg-white px-4 py-2.5 text-xs font-bold text-slate-600"
          >
            <ArrowLeft size={15} />
            Volver al panel
          </Link>
          <UndeliveredOrdersModule scope="admin" />
        </div>
      </main>
    </RouteGuard>
  );
}
