'use client';

import { db } from "@/lib/firebase/config";
import { 
  collection, 
  query, 
  onSnapshot,
  serverTimestamp,
  doc,
  getDoc,
  where,
  getDocs,
  limit,
  setDoc,
  orderBy
} from "firebase/firestore";
import { Player, ScoutingReport, PlayerList, ScheduledMatch, QuickNote } from "@/lib/types";
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

/**
 * Jugadores - Gestión de Persistencia No Bloqueante
 */
export function savePlayer(playerData: Omit<Player, 'id'>, id?: string): string {
  if (!playerData.scoutId) {
    throw new Error("CRITICAL: scoutId is required to save a player record.");
  }

  const docRef = id ? doc(db, "players", id) : doc(collection(db, "players"));
  const finalId = docRef.id;
  const isUpdate = !!id;

  const data = { 
    ...playerData, 
    [isUpdate ? 'updatedAt' : 'createdAt']: serverTimestamp() 
  };

  setDoc(docRef, data, { merge: true })
    .catch(async (serverError) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({ 
        path: docRef.path, 
        operation: isUpdate ? 'update' : 'create', 
        requestResourceData: data 
      }));
    });

  return finalId;
}

export async function getPlayer(id: string): Promise<Player | null> {
  const docRef = doc(db, "players", id);
  try {
    const snap = await getDoc(docRef);
    return snap.exists() ? { id: snap.id, ...snap.data() } as Player : null;
  } catch (error) {
    console.error("Error getting player:", error);
    return null;
  }
}

/**
 * Escucha solo los jugadores captados por el scout actual.
 */
export function subscribeToPlayers(scoutId: string | null, callback: (players: Player[]) => void) {
  if (!scoutId) return () => {};
  const colRef = collection(db, "players");
  const q = query(colRef, where("scoutId", "==", scoutId), orderBy("createdAt", "desc"));
  
  return onSnapshot(
    q,
    (snap) => callback(snap.docs.map(d => ({ id: d.id, ...d.data() })) as Player[]),
    async (err) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({ path: colRef.path, operation: 'list' }));
    }
  );
}

/**
 * Escucha todos los jugadores de la organización (Para planes de Club/Admin).
 */
export function subscribeToGlobalPlayers(callback: (players: Player[]) => void) {
  const colRef = collection(db, "players");
  const q = query(colRef, orderBy("createdAt", "desc"));
  
  return onSnapshot(
    q,
    (snap) => callback(snap.docs.map(d => ({ id: d.id, ...d.data() })) as Player[]),
    async (err) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({ path: colRef.path, operation: 'list' }));
    }
  );
}

/**
 * Informes - Gestión de Persistencia No Bloqueante
 */
export function saveReport(reportData: Partial<ScoutingReport>, id?: string): string {
  const docRef = id ? doc(db, "reports", id) : doc(collection(db, "reports"));
  const finalId = docRef.id;
  const isUpdate = !!id;

  const data = { 
    ...reportData, 
    [isUpdate ? 'updatedAt' : 'createdAt']: serverTimestamp() 
  };

  setDoc(docRef, data, { merge: true })
    .catch(async (serverError) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({ 
        path: docRef.path, 
        operation: isUpdate ? 'update' : 'create', 
        requestResourceData: data 
      }));
    });

  return finalId;
}

export async function getLatestReportForPlayer(playerId: string): Promise<ScoutingReport | null> {
  const colRef = collection(db, "reports");
  const q = query(colRef, where("playerId", "==", playerId), limit(1));
  try {
    const snap = await getDocs(q);
    return !snap.empty ? { id: snap.docs[0].id, ...snap.docs[0].data() } as ScoutingReport : null;
  } catch (error) {
    console.error("Error getting report:", error);
    return null;
  }
}

export function subscribeToReports(scoutId: string | null, callback: (reports: ScoutingReport[]) => void) {
  if (!scoutId) return () => {};
  const colRef = collection(db, "reports");
  const q = query(colRef, where("scoutId", "==", scoutId));
  return onSnapshot(
    q,
    (snap) => callback(snap.docs.map(d => ({ id: d.id, ...d.data() })) as ScoutingReport[]),
    async (err) => errorEmitter.emit('permission-error', new FirestorePermissionError({ path: colRef.path, operation: 'list' }))
  );
}

/**
 * Agenda de Partidos - Gestión No Bloqueante
 */
export function saveScheduledMatch(matchData: Omit<ScheduledMatch, 'id'>, id?: string): string {
  const docRef = id ? doc(db, "scheduledMatches", id) : doc(collection(db, "scheduledMatches"));
  const finalId = docRef.id;
  const isUpdate = !!id;

  const data = { 
    ...matchData, 
    [isUpdate ? 'updatedAt' : 'createdAt']: serverTimestamp() 
  };

  setDoc(docRef, data, { merge: true })
    .catch(async (serverError) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({ 
        path: docRef.path, 
        operation: isUpdate ? 'update' : 'create', 
        requestResourceData: data 
      }));
    });

  return finalId;
}

export function subscribeToScheduledMatches(scoutId: string | null, callback: (matches: ScheduledMatch[]) => void) {
  if (!scoutId) return () => {};
  const colRef = collection(db, "scheduledMatches");
  const q = query(colRef, where("scoutId", "==", scoutId));
  return onSnapshot(
    q,
    (snap) => callback(snap.docs.map(d => ({ id: d.id, ...d.data() })) as ScheduledMatch[]),
    async (err) => errorEmitter.emit('permission-error', new FirestorePermissionError({ path: colRef.path, operation: 'list' }))
  );
}
