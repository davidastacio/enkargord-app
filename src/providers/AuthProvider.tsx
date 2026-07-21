"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  signOut, 
  createUserWithEmailAndPassword,
  User as FirebaseUser 
} from 'firebase/auth';
import { doc, getDoc, setDoc, collection } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/client';

export type UserRole = 'Cliente' | 'Tienda' | 'Motorista' | 'Admin';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  storeId?: string;
  createdAt: string;
}

interface AuthContextType {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  role: UserRole | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<UserProfile>;
  registerUser: (email: string, password: string, name: string, phone: string, role: UserRole) => Promise<UserProfile>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  // Load profile from Firestore
  const fetchProfile = async (uid: string): Promise<UserProfile | null> => {
    try {
      const docRef = doc(db, 'users', uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data() as Omit<UserProfile, 'uid'>;
        return { uid, ...data };
      }
      return null;
    } catch (e) {
      console.error('Error fetching user profile:', e);
      return null;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        setUser(firebaseUser);
        const userProfile = await fetchProfile(firebaseUser.uid);
        if (userProfile) {
          setProfile(userProfile);
          setRole(userProfile.role);
        } else {
          // Fallback if no Firestore profile exists (shouldn't happen under normal registration)
          const fallbackProfile: UserProfile = {
            uid: firebaseUser.uid,
            name: firebaseUser.displayName || 'Usuario EnkargoRD',
            email: firebaseUser.email || '',
            role: 'Cliente',
            createdAt: new Date().toISOString(),
          };
          setProfile(fallbackProfile);
          setRole('Cliente');
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
      const credentials = await signInWithEmailAndPassword(auth, email, password);
      let userProfile = await fetchProfile(credentials.user.uid);
      
      // Auto-recovery mechanism: If user exists in Auth but not in Firestore, create default profile
      if (!userProfile) {
        const defaultProfile: UserProfile = {
          uid: credentials.user.uid,
          name: credentials.user.displayName || email.split('@')[0],
          email: email,
          role: 'Cliente',
          createdAt: new Date().toISOString(),
        };
        await setDoc(doc(db, 'users', credentials.user.uid), {
          name: defaultProfile.name,
          email: defaultProfile.email,
          role: defaultProfile.role,
          createdAt: defaultProfile.createdAt
        });
        userProfile = defaultProfile;
      }
      
      setProfile(userProfile);
      setRole(userProfile.role);
      return userProfile;
    } catch (error) {
      setLoading(false);
      throw error;
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
    try {
      // 1. Create in Firebase Auth
      const credentials = await createUserWithEmailAndPassword(auth, email, password);
      const uid = credentials.user.uid;
      
      let storeId = '';
      // 2. If role is Tienda, create store document first
      if (role === 'Tienda') {
        const storeRef = doc(collection(db, 'stores'));
        storeId = storeRef.id;
        
        await setDoc(storeRef, {
          id: storeId,
          ownerUid: uid,
          commercialName: name,
          phone,
          email,
          status: 'pending',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }

      // 3. Create user profile document in Firestore users/{uid}
      const profileData: Omit<UserProfile, 'uid'> = {
        name,
        email,
        phone,
        role,
        storeId: storeId || undefined,
        createdAt: new Date().toISOString(),
      };
      
      await setDoc(doc(db, 'users', uid), profileData);
      
      const newProfile: UserProfile = { uid, ...profileData };
      setProfile(newProfile);
      setRole(role);
      return newProfile;
    } catch (error) {
      setLoading(false);
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

  return (
    <AuthContext.Provider value={{ user, profile, role, loading, login, registerUser, logout }}>
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
