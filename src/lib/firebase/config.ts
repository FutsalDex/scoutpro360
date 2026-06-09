import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";
import { getAuth, Auth } from "firebase/auth";

/**
 * Configuración de Firebase - ScoutPro 360
 * Valores extraídos de la consola oficial del proyecto.
 */
const firebaseConfig = {
  apiKey: "AIzaSyAA0CuASNFvj9DNjTnJh1KtZmoakufthe4",
  authDomain: "studio-4533708423-7da6a.firebaseapp.com",
  projectId: "studio-4533708423-7da6a",
  storageBucket: "studio-4533708423-7da6a.firebasestorage.app",
  messagingSenderId: "206496988263",
  appId: "1:206496988263:web:c6b4e1a1371bb1f32828c2"
};

// Inicialización Singleton segura para Next.js
const app: FirebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

const db: Firestore = getFirestore(app);
const storage: FirebaseStorage = getStorage(app);
const auth: Auth = getAuth(app);

export { app, db, storage, auth };
