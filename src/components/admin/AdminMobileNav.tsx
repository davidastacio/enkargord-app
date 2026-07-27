"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Users, Truck, Settings, Bike } from "lucide-react";
import LogoutButton from "@/components/auth/LogoutButton";

const items = [
  { href: "/admin", label: "Inicio", icon: Home },
  { href: "/admin/usuarios", label: "Usuarios", icon: Users },
  { href: "/admin/mensajeros", label: "Flota", icon: Truck },
  { href: "/admin/operaciones", label: "Tarifas", icon: Settings },
  { href: "/admin/mis-entregas", label: "Repartir", icon: Bike },
];

export default function AdminMobileNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-[80] flex items-stretch overflow-x-auto border-t border-slate-200 bg-white/95 px-1 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_30px_rgba(15,23,42,0.08)] backdrop-blur lg:hidden">
      {items.map(({ href, label, icon: Icon }) => {
        const active = href === "/admin" ? pathname === href : pathname.startsWith(href);
        return (
          <Link key={href} href={href} className={`flex min-w-[62px] flex-1 flex-col items-center gap-1 px-2 py-2 text-[10px] font-bold ${active ? "text-[#d3121a]" : "text-slate-500"}`}>
            <Icon size={17} />
            {label}
          </Link>
        );
      })}
      <LogoutButton className="flex min-w-[62px] flex-1 flex-col items-center gap-1 px-2 py-2 text-[10px] font-bold text-slate-500">
        Salir
      </LogoutButton>
    </nav>
  );
}
