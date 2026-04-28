import { FirebaseApp, getApp, getApps, initializeApp } from "firebase/app";
import { Auth, GoogleAuthProvider, getAuth } from "firebase/auth";
import { Firestore, getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "",
};

let appInstance: FirebaseApp | null = null;
let authInstance: Auth | null = null;
let firestoreInstance: Firestore | null = null;
let providerInstance: GoogleAuthProvider | null = null;

function assertFirebaseEnv(): void {
  const missing = Object.entries(firebaseConfig)
    .filter(([, value]) => !value)
    .map(([key]) => {
      switch (key) {
        case "apiKey":
          return "NEXT_PUBLIC_FIREBASE_API_KEY";
        case "authDomain":
          return "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN";
        case "projectId":
          return "NEXT_PUBLIC_FIREBASE_PROJECT_ID";
        case "storageBucket":
          return "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET";
        case "messagingSenderId":
          return "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID";
        case "appId":
          return "NEXT_PUBLIC_FIREBASE_APP_ID";
        default:
          return key;
      }
    });

  if (missing.length > 0) {
    throw new Error(
      `Missing required Firebase env vars: ${missing.join(", ")}`,
    );
  }
}

export function getFirebaseApp(): FirebaseApp {
  if (appInstance) {
    return appInstance;
  }

  assertFirebaseEnv();
  appInstance = getApps().length ? getApp() : initializeApp(firebaseConfig);
  return appInstance;
}

export function getFirebaseAuth(): Auth {
  if (authInstance) {
    return authInstance;
  }

  authInstance = getAuth(getFirebaseApp());
  return authInstance;
}

export function getFirebaseDb(): Firestore {
  if (firestoreInstance) {
    return firestoreInstance;
  }

  firestoreInstance = getFirestore(getFirebaseApp());
  return firestoreInstance;
}

export function getGoogleProvider(): GoogleAuthProvider {
  if (providerInstance) {
    return providerInstance;
  }

  providerInstance = new GoogleAuthProvider();
  providerInstance.setCustomParameters({ prompt: "select_account" });
  return providerInstance;
}
