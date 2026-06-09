import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";

/**
 * Configuración oficial de Firebase para ScoutPro 360.
 * Datos extraídos directamente de la configuración del proyecto proporcionada.
 */
const firebaseConfig = {
  apiKey: "AIzaSyAA0CuASNFvj9DNjTnJh1KtZmoakufthe4",
  authDomain: "studio-4533708423-7da6a.firebaseapp.com",
  projectId: "studio-4533708423-7da6a",
  storageBucket: "studio-4533708423-7da6a.firebasestorage.app",
  messagingSenderId: "206496988263",
  appId: "1:206496988263:web:c6b4e1a1371bb1f32828c2"
};

// Inicialización persistente para evitar errores de duplicidad en Next.js
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);

export { app, db, storage, auth };
