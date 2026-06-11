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
        // Captura errores de permisos, red, etc.
        console.error("Storage upload task error:", error);
        reject(error);
      },
      () => {
        // Al completar, intentamos obtener la URL
        getDownloadURL(uploadTask.snapshot.ref)
          .then((downloadURL) => resolve(downloadURL))
          .catch((error) => {
            console.error("Error getting download URL after upload:", error);
            reject(error);
          });
      }
    );
  });
}
