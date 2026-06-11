import { storage } from "@/lib/firebase/config";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

/**
 * Sube un archivo a Firebase Storage de forma directa y fiable.
 * @param file El archivo a subir.
 * @param path La ruta en el storage (ej: 'users/uid/photo.jpg').
 */
export async function uploadFile(
  file: File,
  path: string
): Promise<string> {
  if (!storage) {
    throw new Error("Firebase Storage no está inicializado en la configuración.");
  }

  try {
    const storageRef = ref(storage, path);
    
    // Operación atómica de subida
    const snapshot = await uploadBytes(storageRef, file);
    
    // Obtención de la URL de descarga confirmada
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return downloadURL;
  } catch (error: any) {
    // Solo propagamos el error para que el componente decida cómo informarlo al usuario
    // Evitamos console.error excesivo para no disparar overlays de Next.js en dev
    throw error;
  }
}
