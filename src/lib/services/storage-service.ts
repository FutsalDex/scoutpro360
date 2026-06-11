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
    
    // Usamos uploadBytes para una operación atómica más robusta
    const snapshot = await uploadBytes(storageRef, file);
    
    // Obtenemos la URL de descarga una vez confirmada la subida
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return downloadURL;
  } catch (error: any) {
    console.error("Error crítico en StorageService:", error.code, error.message);
    throw error;
  }
}
