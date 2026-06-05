
'use client';

import { db } from "@/lib/firebase/config";
import { 
  doc, 
  getDoc, 
  setDoc, 
  serverTimestamp 
} from "firebase/firestore";
import { UserProfile, UserRole } from "@/lib/types";
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

/**
 * Obtiene o crea el perfil de un usuario en Firestore.
 */
export async function getOrCreateUserProfile(uid: string, email: string, isAnonymous: boolean): Promise<UserProfile> {
  const userRef = doc(db, "users", uid);
  
  try {
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      return userSnap.data() as UserProfile;
    } else {
      // Crear perfil por defecto
      const newProfile: UserProfile = {
        uid,
        email: email || (isAnonymous ? 'guest@scoutpro360.com' : ''),
        displayName: isAnonymous ? 'Invitado' : (email ? email.split('@')[0] : 'Scout'),
        role: isAnonymous ? 'guest' : 'analyst', // Por defecto analista para nuevos registros
        createdAt: serverTimestamp()
      };
      
      await setDoc(userRef, newProfile);
      return newProfile;
    }
  } catch (serverError: any) {
    const permissionError = new FirestorePermissionError({
      path: userRef.path,
      operation: 'get',
    });
    errorEmitter.emit('permission-error', permissionError);
    // Retornar perfil temporal si hay error de permisos (posible en el primer login)
    return {
      uid,
      email: email || 'guest@scoutpro360.com',
      displayName: 'Usuario',
      role: isAnonymous ? 'guest' : 'analyst',
      createdAt: null
    };
  }
}

/**
 * Actualiza el perfil del usuario (ej: cambiar rol, admin solamente en teoría)
 */
export async function updateUserProfile(uid: string, updates: Partial<UserProfile>) {
  const userRef = doc(db, "users", uid);
  try {
    await setDoc(userRef, updates, { merge: true });
  } catch (error) {
    console.error("Error updating profile:", error);
  }
}
