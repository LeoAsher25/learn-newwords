"use client";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  User,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { FirebaseError } from "firebase/app";
import {
  PropsWithChildren,
  createElement,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { getFirebaseAuth, getGoogleProvider } from "@/lib/firebase";
import { ensureUserDocument } from "@/lib/firestore";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(getFirebaseAuth(), async (firebaseUser) => {
      setUser(firebaseUser);
      // Auth state should not be blocked by Firestore network latency/retries.
      setLoading(false);

      if (firebaseUser) {
        void ensureUserDocument(firebaseUser).catch((error) => {
          if (error instanceof FirebaseError && error.code === "unavailable") {
            return;
          }

          console.error("Failed to ensure user document:", error);
        });
      }
    });

    return unsubscribe;
  }, []);

  const value = useMemo(() => ({ user, loading }), [user, loading]);

  return createElement(AuthContext.Provider, { value }, children);
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}

export async function signInWithGoogle() {
  await signInWithPopup(getFirebaseAuth(), getGoogleProvider());
}

export async function signInWithEmail(email: string, password: string) {
  await signInWithEmailAndPassword(getFirebaseAuth(), email, password);
}

export async function signUpWithEmail(
  displayName: string,
  email: string,
  password: string,
) {
  const credential = await createUserWithEmailAndPassword(
    getFirebaseAuth(),
    email,
    password,
  );

  if (displayName.trim()) {
    await updateProfile(credential.user, { displayName: displayName.trim() });
  }

  await ensureUserDocument(credential.user);
}

export async function signOutFromApp() {
  await signOut(getFirebaseAuth());
}
