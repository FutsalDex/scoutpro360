import { storage } from "@/lib/firebase/config";
import { ref, uploadBytes, getDownloadURL, listAll } from "firebase/storage";

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
    throw error;
  }
}

/**
 * Lista todos los archivos de una carpeta y devuelve sus URLs de descarga.
 */
export async function listFolderFiles(path: string): Promise<{ name: string, url: string }[]> {
  if (!storage) return [];
  
  try {
    const folderRef = ref(storage, path);
    const result = await listAll(folderRef);
    
    const files = await Promise.all(
      result.items.map(async (item) => {
        const url = await getDownloadURL(item);
        return { name: item.name, url };
      })
    );
    
    return files;
  } catch (error) {
    console.error("Error listing files:", error);
    return [];
  }
}
