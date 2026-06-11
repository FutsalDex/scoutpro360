import { storage } from "@/lib/firebase/config";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";

/**
 * Sube un archivo a Firebase Storage y devuelve la URL de descarga.
 * @param file El archivo a subir.
 * @param path La ruta en el storage (ej: 'players/player_id/photo.jpg').
 * @param onProgress Callback opcional para monitorear el progreso (0-100).
 */
export async function uploadFile(
  file: File,
  path: string,
  onProgress?: (progress: number) => void
): Promise<string> {
  // Verificación inicial para evitar fallos silenciosos
  if (!storage) {
    throw new Error("Firebase Storage no está inicializado.");
  }

  const storageRef = ref(storage, path);
  const uploadTask = uploadBytesResumable(storageRef, file);

  return new Promise((resolve, reject) => {
    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        if (onProgress) onProgress(progress);
      },
      (error) => {
        // Captura errores de permisos (403), cuota, etc.
        console.error("Storage task error:", error.code, error.message);
        reject(error);
      },
      async () => {
        try {
          // Al completar la subida, obtenemos la URL pública
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadURL);
        } catch (error) {
          console.error("Error obteniendo downloadURL:", error);
          reject(error);
        }
      }
    );
  });
}
