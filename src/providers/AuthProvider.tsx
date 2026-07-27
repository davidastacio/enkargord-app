"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  signOut, 
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  User as FirebaseUser 
} from 'firebase/auth';
import { auth } from '@/lib/firebase/client';

export type UserRole = 'Cliente' | 'Tienda' | 'Motorista' | 'Admin' | 'Colaborador';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  storeId?: string;
  courierId?: string;
  createdAt: string;
}

interface AuthContextType {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  role: UserRole | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<UserProfile>;
  loginWithGoogle: (requestedRole?: UserRole) => Promise<UserProfile>;
  registerUser: (email: string, password: string, name: string, phone: string, role: UserRole) => Promise<UserProfile>;
  refreshProfile: () => Promise<UserProfile | null>;
  logout: () => Promise<void>;
  impersonateUser: (targetProfile: UserProfile | null) => void;
  isImpersonating: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function roleFromClaim(value: unknown): UserRole | null {
  if (typeof value !== 'string') return null;

  const normalized = value.trim().toLowerCase();
  if (normalized === 'admin' || normalized === 'administrador') return 'Admin';
  if (normalized === 'store' || normalized === 'tienda') return 'Tienda';
  if (normalized === 'courier' || normalized === 'motorista') return 'Motorista';
  if (normalized === 'customer' || normalized === 'cliente') return 'Cliente';
  if (normalized === 'collaborator' || normalized === 'colaborador') return 'Colaborador';
  return null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [impersonatedProfile, setImpersonatedProfile] = useState<UserProfile | null>(null);

  const impersonateUser = (targetProfile: UserProfile | null) => {
    if (targetProfile) {
      setImpersonatedProfile(targetProfile);
      if (targetProfile.role === 'Tienda') {
        router.push('/tienda');
      } else if (targetProfile.role === 'Motorista') {
        router.push('/motorista');
      }
    } else {
      setImpersonatedProfile(null);
      router.push('/admin/usuarios');
    }
  };

  // Load profile from Supabase while Firebase remains the auth provider
  const fetchProfile = async (
    firebaseUser: FirebaseUser,
  ): Promise<UserProfile | null> => {
    const token = await firebaseUser.getIdToken();
    const response = await fetch('/api/auth/supabase-profile', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error('SUPABASE_PROFILE_READ_FAILED');
    const result = await response.json();
    const rawProfile = result.profile as UserProfile | null;
    if (!rawProfile) return null;

    const normalizedRole =
      roleFromClaim(rawProfile.role) ??
      (rawProfile.storeId
        ? 'Tienda'
        : rawProfile.courierId
          ? 'Motorista'
          : 'Cliente');
    return { ...rawProfile, role: normalizedRole };
  };

  const buildRecoveryProfile = async (
    firebaseUser: FirebaseUser,
    fallbackEmail = '',
  ): Promise<UserProfile> => {
    const tokenResult = await firebaseUser.getIdTokenResult();
    const claimedRole =
      roleFromClaim(tokenResult.claims.appRole) ??
      roleFromClaim(tokenResult.claims.applicationRole);
    const recoveredRole = claimedRole ?? 'Cliente';

    return {
      uid: firebaseUser.uid,
      name: firebaseUser.displayName || fallbackEmail.split('@')[0] || 'Usuario EnkargoRD',
      email: firebaseUser.email || fallbackEmail,
      role: recoveredRole,
      storeId:
        recoveredRole === 'Tienda'
          ? `STORE-${crypto.randomUUID().replaceAll('-', '').slice(0, 16).toUpperCase()}`
          : undefined,
      createdAt: new Date().toISOString(),
    };
  };

  const ensureSupabaseFirebaseClaim = async (firebaseUser: FirebaseUser) => {
    const tokenResult = await firebaseUser.getIdTokenResult();
    if (tokenResult.claims.role === 'authenticated') return;

    const idToken = await firebaseUser.getIdToken();
    const response = await fetch('/api/auth/supabase-claim', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${idToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('SUPABASE_FIREBASE_CLAIM_FAILED');
    }

    await firebaseUser.getIdToken(true);
  };

  const syncSupabaseProfile = async (
    firebaseUser: FirebaseUser,
    userProfile: UserProfile,
  ) => {
    const idToken = await firebaseUser.getIdToken();
    const response = await fetch('/api/auth/supabase-profile', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${idToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: userProfile.name || '',
        email: userProfile.email || '',
        phone: userProfile.phone || '',
        role: userProfile.role,
        storeId: userProfile.storeId || null,
        createdAt: userProfile.createdAt || new Date().toISOString(),
      }),
    });
    if (!response.ok) throw new Error('SUPABASE_PROFILE_SYNC_FAILED');
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        setUser(firebaseUser);
        try {
          await ensureSupabaseFirebaseClaim(firebaseUser);
        } catch (claimError) {
          console.error('Error preparing Firebase session for Supabase:', claimError);
        }
        try {
          let userProfile = await fetchProfile(firebaseUser);
          if (!userProfile) {
            const fallbackProfile = await buildRecoveryProfile(firebaseUser);
            await syncSupabaseProfile(firebaseUser, fallbackProfile);
            userProfile = fallbackProfile;
          }
          setProfile(userProfile);
          setRole(userProfile.role);
        } catch (profileError) {
          console.error('Error loading Supabase profile:', profileError);
          setProfile(null);
          setRole(null);
        }
      } else {
        setUser(null);
        setProfile(null);
        setRole(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<UserProfile> => {
    setLoading(true);
    try {
      const normalizedEmail = email.trim().toLowerCase();
      const credentials = await signInWithEmailAndPassword(auth, normalizedEmail, password);
      let userProfile = await fetchProfile(credentials.user);
      
      // Auto-recovery: create a Supabase profile for existing Firebase Auth users.
      if (!userProfile) {
        const defaultProfile = await buildRecoveryProfile(credentials.user, normalizedEmail);
        await syncSupabaseProfile(credentials.user, defaultProfile);
        userProfile = defaultProfile;
      }

      // "Cliente" is a legacy role with no panel. Migrate those accounts to
      // Tienda on their next password login, matching the current registration
      // options and the Google login behavior.
      if (userProfile.role === 'Cliente') {
        userProfile = {
          ...userProfile,
          role: 'Tienda',
          storeId:
            userProfile.storeId ||
            `STORE-${crypto.randomUUID().replaceAll('-', '').slice(0, 16).toUpperCase()}`,
        };
        await syncSupabaseProfile(credentials.user, userProfile);
      }
      
      setProfile(userProfile);
      setRole(userProfile.role);
      return userProfile;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async (requestedRole?: UserRole): Promise<UserProfile> => {
    if (loading) throw new Error('AUTH_REQUEST_IN_PROGRESS');
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const credentials = await signInWithPopup(auth, provider);
      await ensureSupabaseFirebaseClaim(credentials.user);
      let userProfile = await fetchProfile(credentials.user);
      const newRole = requestedRole || 'Tienda';
      if (!userProfile || (userProfile.role === 'Cliente' && newRole !== 'Cliente')) {
        const storeId =
          newRole === 'Tienda'
            ? `STORE-${crypto.randomUUID().replaceAll('-', '').slice(0, 16).toUpperCase()}`
            : undefined;
        userProfile = {
          uid: credentials.user.uid,
          name: userProfile?.name || credentials.user.displayName || 'Usuario EnkargoRD',
          email: userProfile?.email || credentials.user.email || '',
          phone: userProfile?.phone || credentials.user.phoneNumber || '',
          role: newRole,
          storeId: userProfile?.storeId || storeId,
          createdAt: userProfile?.createdAt || new Date().toISOString(),
        };
        await syncSupabaseProfile(credentials.user, userProfile);
      }
      setProfile(userProfile);
      setRole(userProfile.role);
      return userProfile;
    } finally {
      setLoading(false);
    }
  };

  const registerUser = async (
    email: string,
    password: string,
    name: string,
    phone: string,
    role: UserRole
  ): Promise<UserProfile> => {
    setLoading(true);
    let stage = 'start';
    try {
      const normalizedEmail = email.trim().toLowerCase();
      // 1. Create in Firebase Auth
      stage = 'auth-create';
      const credentials = await createUserWithEmailAndPassword(auth, normalizedEmail, password);
      const uid = credentials.user.uid;
      console.log("auth-user-created", { uid });
      
      const storeId =
        role === 'Tienda'
          ? `STORE-${crypto.randomUUID().replaceAll('-', '').slice(0, 16).toUpperCase()}`
          : '';
      stage = 'supabase-profile-start';
      const profileData: Omit<UserProfile, 'uid'> = {
        name,
        email: normalizedEmail,
        phone,
        role,
        storeId: storeId || undefined,
        createdAt: new Date().toISOString(),
      };
      const newProfile: UserProfile = { uid, ...profileData };
      await ensureSupabaseFirebaseClaim(credentials.user);
      await syncSupabaseProfile(credentials.user, newProfile);
      console.log("supabase-profile-created", { uid });
      
      stage = 'session-create';
      setProfile(newProfile);
      setRole(role);
      console.log("session-created");
      
      stage = 'registration-completed';
      console.log("registration-completed");
      return newProfile;
    } catch (error: any) {
      setLoading(false);
      console.error("Registration error at stage: " + stage, {
        stage: stage,
        code: error.code || 'unknown',
        message: error.message ? error.message.replace(/[^a-zA-Z0-9\s:.-]/g, '') : 'No message available'
      });
      throw error;
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await signOut(auth);
    } finally {
      setLoading(false);
    }
  };

  const refreshProfile = async (): Promise<UserProfile | null> => {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) return null;
    const refreshedProfile = await fetchProfile(firebaseUser);
    setProfile(refreshedProfile);
    setRole(refreshedProfile?.role ?? null);
    return refreshedProfile;
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      profile: impersonatedProfile || profile, 
      role: impersonatedProfile ? impersonatedProfile.role : role, 
      loading, 
      login, 
      loginWithGoogle, 
      registerUser, 
      refreshProfile, 
      logout,
      impersonateUser,
      isImpersonating: !!impersonatedProfile
    }}>
      {impersonatedProfile && (
        <div className="bg-amber-500 text-slate-950 px-6 py-3.5 text-xs font-extrabold flex items-center justify-between sticky top-0 z-[10000] shadow-md border-b border-amber-600 font-sans">
          <div className="flex items-center gap-3">
            <span className="bg-amber-950 text-amber-100 px-3 py-1 rounded-xl text-[10px] uppercase tracking-wider font-extrabold shadow-sm">
              Modo Dios Activo
            </span>
            <span className="font-semibold text-amber-950">
              Viendo la plataforma como la tienda: <strong className="font-black underline">{impersonatedProfile?.name}</strong> ({impersonatedProfile?.email})
            </span>
          </div>
          <button 
            onClick={() => impersonateUser(null)}
            className="bg-amber-950 hover:bg-amber-900 text-white font-extrabold px-4 py-2 rounded-xl transition-all shadow-sm text-[10px] uppercase tracking-wider"
          >
            Salir de Modo Dios
          </button>
        </div>
      )}
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}
