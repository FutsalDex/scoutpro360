
'use client';

import { db } from "@/lib/firebase/config";
import { 
  doc, 
  getDoc, 
  setDoc, 
  collection,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp 
} from "firebase/firestore";
import { UserProfile, UserRole } from "@/lib/types";
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

const ADMIN_EMAIL = 'admin.scoutpro360@gmail.com';

/**
 * Obtiene o crea el perfil de un usuario en Firestore.
 * Si el email coincide con el ADMIN_EMAIL, se le asigna el rol de administrador automáticamente.
 */
export async function getOrCreateUserProfile(uid: string, email: string, isAnonymous: boolean, requestedRole?: UserRole): Promise<UserProfile> {
  const userRef = doc(db, "users", uid);
  
  try {
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      const existingProfile = userSnap.data() as UserProfile;
      if (email === ADMIN_EMAIL && existingProfile.role !== 'admin') {
        updateUserProfile(uid, { role: 'admin' });
        return { ...existingProfile, role: 'admin' };
      }
      return existingProfile;
    } else {
      let role: UserRole = requestedRole || (isAnonymous ? 'invitado' : 'analista');
      if (email === ADMIN_EMAIL) {
        role = 'admin';
      }

      const newProfile: UserProfile = {
        uid,
        email: email || (isAnonymous ? 'guest@scoutpro360.com' : ''),
        displayName: isAnonymous ? 'Invitado' : (email ? email.split('@')[0] : 'Scout'),
        role: role,
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
    return {
      uid,
      email: email || 'guest@scoutpro360.com',
      displayName: 'Usuario',
      role: email === ADMIN_EMAIL ? 'admin' : (isAnonymous ? 'invitado' : 'analista'),
      createdAt: null
    };
  }
}

/**
 * Escucha el perfil de un usuario específico en tiempo real.
 */
export function subscribeToUserProfile(uid: string, callback: (profile: UserProfile) => void) {
  const userRef = doc(db, "users", uid);
  return onSnapshot(
    userRef,
    (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.data() as UserProfile);
      }
    },
    async (serverError) => {
      const permissionError = new FirestorePermissionError({
        path: userRef.path,
        operation: 'get',
      });
      errorEmitter.emit('permission-error', permissionError);
    }
  );
}

/**
 * Obtiene todos los usuarios en tiempo real (Solo para admins)
 */
export function subscribeToUsers(callback: (users: UserProfile[]) => void) {
  const colRef = collection(db, "users");
  const q = query(colRef, orderBy("createdAt", "desc"));
  
  return onSnapshot(
    q, 
    (snapshot) => {
      const users = snapshot.docs.map(doc => ({
        ...doc.data()
      })) as UserProfile[];
      callback(users);
    },
    async (serverError) => {
      const permissionError = new FirestorePermissionError({
        path: colRef.path,
        operation: 'list',
      });
      errorEmitter.emit('permission-error', permissionError);
    }
  );
}

/**
 * Actualiza el perfil del usuario (Mutación no bloqueante)
 */
export function updateUserProfile(uid: string, updates: Partial<UserProfile>) {
  const userRef = doc(db, "users", uid);
  
  setDoc(userRef, updates, { merge: true })
    .catch(async (serverError) => {
      const permissionError = new FirestorePermissionError({
        path: userRef.path,
        operation: 'write',
        requestResourceData: updates,
      });
      errorEmitter.emit('permission-error', permissionError);
    });
}
