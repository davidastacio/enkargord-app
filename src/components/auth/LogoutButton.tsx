"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function LogoutButton({
  className = "",
  children = "Cerrar sesión",
}: {
  className?: string;
  children?: ReactNode;
}) {
  const { logout } = useAuth();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await logout();
      router.push("/login");
      router.refresh();
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <button
      type="button"
      onClick={() => void handleLogout()}
      disabled={isLoggingOut}
      className={className}
    >
      {isLoggingOut ? <Loader2 size={16} className="animate-spin" /> : <LogOut size={16} />}
      {children}
    </button>
  );
}
