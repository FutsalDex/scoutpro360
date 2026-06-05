'use client';

import { db } from "@/lib/firebase/config";
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot,
  serverTimestamp,
  doc,
  getDoc,
  updateDoc,
  where,
  getDocs,
  limit
} from "firebase/firestore";
import { Player, ScoutingReport } from "@/lib/types";
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

/**
 * Guarda un nuevo jugador o actualiza uno existente en Firestore.
 */
export async function savePlayer(playerData: Omit<Player, 'id'>, id?: string) {
  if (id) {
    const docRef = doc(db, "players", id);
    try {
      await updateDoc(docRef, {
        ...playerData,
        updatedAt: serverTimestamp()
      });
      return id;
    } catch (serverError: any) {
      const permissionError = new FirestorePermissionError({
        path: docRef.path,
        operation: 'update',
        requestResourceData: playerData,
      });
      errorEmitter.emit('permission-error', permissionError);
      throw serverError;
    }
  } else {
    const colRef = collection(db, "players");
    const data = {
      ...playerData,
      createdAt: serverTimestamp()
    };

    try {
      const docRef = await addDoc(colRef, data);
      return docRef.id;
    } catch (serverError: any) {
      const permissionError = new FirestorePermissionError({
        path: colRef.path,
        operation: 'create',
        requestResourceData: data,
      });
      errorEmitter.emit('permission-error', permissionError);
      throw serverError;
    }
  }
}

/**
 * Obtiene un jugador específico por ID.
 */
export async function getPlayer(id: string): Promise<Player | null> {
  const docRef = doc(db, "players", id);
  try {
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() } as Player;
    }
    return null;
  } catch (error) {
    console.error("Error getting player:", error);
    return null;
  }
}

/**
 * Obtiene todos los jugadores en tiempo real.
 */
export function subscribeToPlayers(callback: (players: Player[]) => void) {
  const colRef = collection(db, "players");
  const q = query(colRef, orderBy("createdAt", "desc"));
  
  return onSnapshot(
    q, 
    (snapshot) => {
      const players = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Player[];
      callback(players);
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
 * Guarda o actualiza un informe de scouting.
 */
export async function saveReport(reportData: Omit<ScoutingReport, 'id'>, id?: string) {
  if (id) {
    const docRef = doc(db, "reports", id);
    try {
      await updateDoc(docRef, {
        ...reportData,
        updatedAt: serverTimestamp()
      });
    } catch (serverError: any) {
      const permissionError = new FirestorePermissionError({
        path: docRef.path,
        operation: 'update',
        requestResourceData: reportData,
      });
      errorEmitter.emit('permission-error', permissionError);
      throw serverError;
    }
  } else {
    const colRef = collection(db, "reports");
    const data = {
      ...reportData,
      createdAt: serverTimestamp()
    };

    try {
      await addDoc(colRef, data);
    } catch (serverError: any) {
      const permissionError = new FirestorePermissionError({
        path: colRef.path,
        operation: 'create',
        requestResourceData: data,
      });
      errorEmitter.emit('permission-error', permissionError);
      throw serverError;
    }
  }
}

/**
 * Obtiene el informe más reciente de un jugador.
 */
export async function getLatestReportForPlayer(playerId: string): Promise<ScoutingReport | null> {
  const colRef = collection(db, "reports");
  const q = query(colRef, where("playerId", "==", playerId), orderBy("createdAt", "desc"), limit(1));
  
  try {
    const snap = await getDocs(q);
    if (!snap.empty) {
      return { id: snap.docs[0].id, ...snap.docs[0].data() } as ScoutingReport;
    }
    return null;
  } catch (error) {
    console.error("Error getting report:", error);
    return null;
  }
}
