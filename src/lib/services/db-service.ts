
'use client';

import { db } from "@/lib/firebase/config";
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot,
  serverTimestamp 
} from "firebase/firestore";
import { Player } from "@/lib/types";
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export interface ScoutingReport {
  id?: string;
  playerId: string;
  playerName: string;
  scoutId: string;
  scoutName: string;
  pimScore: number;
  summary: string;
  ratings: Record<string, number>;
  notes: Record<string, string>;
  createdAt: any;
}

/**
 * Guarda un nuevo jugador en Firestore
 */
export async function savePlayer(playerData: Omit<Player, 'id'>) {
  const colRef = collection(db, "players");
  const data = {
    ...playerData,
    createdAt: serverTimestamp()
  };

  addDoc(colRef, data)
    .catch(async (serverError) => {
      const permissionError = new FirestorePermissionError({
        path: colRef.path,
        operation: 'create',
        requestResourceData: data,
      });
      errorEmitter.emit('permission-error', permissionError);
    });
    
  return "pending-id"; 
}

/**
 * Obtiene todos los jugadores en tiempo real con manejo de permisos actualizado
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
 * Guarda un informe de scouting en la colección reports
 */
export async function saveReport(reportData: Omit<ScoutingReport, 'id'>) {
  const colRef = collection(db, "reports");
  const data = {
    ...reportData,
    createdAt: serverTimestamp()
  };

  addDoc(colRef, data)
    .catch(async (serverError) => {
      const permissionError = new FirestorePermissionError({
        path: colRef.path,
        operation: 'create',
        requestResourceData: data,
      });
      errorEmitter.emit('permission-error', permissionError);
    });
}
