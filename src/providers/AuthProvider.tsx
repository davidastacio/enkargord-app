"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  signOut, 
  createUserWithEmailAndPassword,
  User as FirebaseUser 
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/client';

export type UserRole = 'Cliente' | 'Tienda' | 'Motorista' | 'Admin';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
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
      const userProfile = await fetchProfile(credentials.user.uid);
      if (!userProfile) {
        throw new Error('No se encontró el perfil de usuario en la base de datos.');
      }
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
      const credentials = await createUserWithEmailAndPassword(auth, email, password);
      const profileData: Omit<UserProfile, 'uid'> = {
        name,
        email,
        phone,
        role,
        createdAt: new Date().toISOString(),
      };
      
      // Store user profile document in Firestore
      await setDoc(doc(db, 'users', credentials.user.uid), profileData);
      
      const newProfile: UserProfile = { uid: credentials.user.uid, ...profileData };
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
