import type { ReactNode } from "react";
import AdminMobileNav from "@/components/admin/AdminMobileNav";
import RouteGuard from "@/components/auth/RouteGuard";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <RouteGuard allowedRoles={["Admin"]}>
      <div className="admin-responsive-shell min-w-0 pb-16 lg:pb-0">
        {children}
        <AdminMobileNav />
      </div>
    </RouteGuard>
  );
}
