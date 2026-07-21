"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { LogOut, ChevronDown, Store, Shield, User, Loader2 } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';

interface StoreData {
  id: string;
  commercialName?: string;
  name?: string;
  logoUrl?: string;
  ownerName?: string;
}

export default function AuthenticatedUserMenu() {
  const { user, profile, logout } = useAuth() as any;
  const [storeData, setStoreData] = useState<StoreData | null>(null);
  const [loadingStore, setLoadingStore] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    async function fetchStore() {
      if (profile?.role === 'Tienda' || profile?.storeId) {
        setLoadingStore(true);
        try {
          const sId = profile.storeId || profile.uid;
          const snap = await getDoc(doc(db, 'stores', sId));
          if (snap.exists()) {
            setStoreData({ id: snap.id, ...snap.data() });
          }
        } catch (e) {
          console.error("Error fetching store profile:", e);
        } finally {
          setLoadingStore(false);
        }
      }
    }
    fetchStore();
  }, [profile]);

  if (!user && !profile) {
    return (
      <div className="flex items-center gap-2 text-xs text-slate-400 font-semibold">
        <Loader2 size={16} className="animate-spin text-[#d3121a]" />
      </div>
    );
  }

  const role = profile?.role || 'Cliente';
  const isStore = role === 'Tienda';
  const isAdmin = role === 'Admin' || role === 'Administrador';

  // Display labels
  const displayName = isStore
    ? storeData?.commercialName || storeData?.name || profile?.name || 'Mi tienda'
    : profile?.name || user?.displayName || 'Usuario';

  const roleLabel = isAdmin ? 'Administrador' : isStore ? 'Tienda' : role;
  const email = profile?.email || user?.email || '';

  // Get initials
  const initials = displayName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'US';

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 text-right border-l border-[#E7E7EC] pl-5 focus:outline-none group"
      >
        <div>
          <div className="font-bold text-xs text-slate-900 group-hover:text-[#d3121a] transition-colors flex items-center justify-end gap-1">
            {displayName}
            <ChevronDown size={12} className="text-slate-400" />
          </div>
          <div className="text-[10px] text-slate-400 font-extrabold tracking-wide uppercase flex items-center justify-end gap-1">
            {isAdmin ? (
              <span className="text-red-600 bg-red-50 px-1.5 py-0.5 rounded font-extrabold flex items-center gap-1">
                <Shield size={10} /> Admin
              </span>
            ) : isStore ? (
              <span className="text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded font-extrabold flex items-center gap-1">
                <Store size={10} /> Tienda
              </span>
            ) : (
              <span>{roleLabel}</span>
            )}
          </div>
        </div>

        {/* Avatar */}
        <div className="relative w-9 h-9 rounded-full bg-slate-100 border border-[#E7E7EC] overflow-hidden flex-shrink-0 shadow-sm">
          {storeData?.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={storeData.logoUrl} alt={displayName} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center font-extrabold text-[#d3121a] text-xs bg-[#fee2e2]">
              {initials}
            </div>
          )}
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-12 w-64 bg-white border border-[#E7E7EC] rounded-2xl shadow-xl z-50 py-2 divide-y divide-slate-100 animate-fade-in">
            <div className="px-4 py-3 bg-slate-50/50">
              <p className="text-xs font-bold text-slate-900 truncate">{displayName}</p>
              <p className="text-[11px] font-medium text-slate-400 truncate">{email}</p>
            </div>

            <div className="py-1">
              <button
                onClick={async () => {
                  setIsOpen(false);
                  await logout();
                }}
                className="w-full text-left px-4 py-2.5 text-xs font-bold text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
              >
                <LogOut size={15} /> Cerrar Sesión
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
