import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";
import { getAuth, Auth } from "firebase/auth";

/**
 * Configuración oficial de Firebase para ScoutPro 360.
 * Se utilizan los valores exactos proporcionados por la consola de Firebase.
 */
const firebaseConfig = {
  apiKey: "AIzaSyAA0CuASNFvj9DNjTnJh1KtZmoakufthe4",
  authDomain: "studio-4533708423-7da6a.firebaseapp.com",
  projectId: "studio-4533708423-7da6a",
  storageBucket: "studio-4533708423-7da6a.firebasestorage.app",
  messagingSenderId: "206496988263",
  appId: "1:206496988263:web:c6b4e1a1371bb1f32828c2"
};

// Inicialización de la App (Singleton para evitar errores en Next.js HMR)
const app: FirebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Inicialización de servicios
const db: Firestore = getFirestore(app);
const storage: FirebaseStorage = getStorage(app);
const auth: Auth = getAuth(app);

export { app, db, storage, auth };
