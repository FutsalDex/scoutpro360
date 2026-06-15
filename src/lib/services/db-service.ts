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
  orderBy,
  writeBatch
} from "firebase/firestore";
import { Player, ScoutingReport, ScheduledMatch } from "@/lib/types";
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

/**
 * Jugadores - Gestión de Persistencia Estricta
 */
export function savePlayer(playerData: Omit<Player, 'id'>, id?: string): string {
  if (!playerData.scoutId) {
    throw new Error("CRITICAL: scoutId is required to save a player.");
  }

  const finalId = id || playerData.name.trim();
  const docRef = doc(db, "players", finalId);
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
    return null;
  }
}

/**
 * Elimina jugadores y sus informes asociados
 */
export async function deletePlayers(playerIds: string[]): Promise<void> {
  const batch = writeBatch(db);
  
  for (const id of playerIds) {
    const playerRef = doc(db, "players", id);
    batch.delete(playerRef);
    
    // Buscar y añadir al batch los informes asociados
    const reportsQuery = query(collection(db, "reports"), where("playerId", "==", id));
    const reportsSnap = await getDocs(reportsQuery);
    reportsSnap.forEach(reportDoc => {
      batch.delete(reportDoc.ref);
    });
  }
  
  await batch.commit().catch(err => {
    errorEmitter.emit('permission-error', new FirestorePermissionError({ 
      path: 'players/multiple', 
      operation: 'delete' 
    }));
    throw err;
  });
}

/**
 * Escucha solo los jugadores vinculados al scout actual.
 */
export function subscribeToPlayers(scoutId: string | null, callback: (players: Player[]) => void) {
  if (!scoutId) return () => {};
  const colRef = collection(db, "players");
  const q = query(colRef, where("scoutId", "==", scoutId));
  
  return onSnapshot(
    q,
    (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() })) as Player[];
      callback(data);
    },
    async (err) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({ path: colRef.path, operation: 'list' }));
    }
  );
}

export function subscribeToGlobalPlayers(callback: (players: Player[]) => void) {
  const colRef = collection(db, "players");
  return onSnapshot(
    colRef,
    (snap) => callback(snap.docs.map(d => ({ id: d.id, ...d.data() })) as Player[]),
    async (err) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({ path: colRef.path, operation: 'list' }));
    }
  );
}

/**
 * Informes - Gestión de Persistencia Estricta
 */
export function saveReport(reportData: Partial<ScoutingReport>, id?: string): string {
  if (!reportData.scoutId || !reportData.playerId) {
    throw new Error("CRITICAL: scoutId and playerId are required to save a report.");
  }

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

export async function getReport(id: string): Promise<ScoutingReport | null> {
  const docRef = doc(db, "reports", id);
  try {
    const snap = await getDoc(docRef);
    return snap.exists() ? { id: snap.id, ...snap.data() } as ScoutingReport : null;
  } catch (error) {
    return null;
  }
}

export async function getLatestReportForPlayer(playerId: string): Promise<ScoutingReport | null> {
  const colRef = collection(db, "reports");
  const q = query(colRef, where("playerId", "==", playerId), orderBy("createdAt", "desc"), limit(1));
  try {
    const snap = await getDocs(q);
    return !snap.empty ? { id: snap.docs[0].id, ...snap.docs[0].data() } as ScoutingReport : null;
  } catch (error) {
    return null;
  }
}

export function subscribeToPlayerReports(playerId: string, callback: (reports: ScoutingReport[]) => void) {
  const colRef = collection(db, "reports");
  const q = query(colRef, where("playerId", "==", playerId), orderBy("createdAt", "desc"));
  return onSnapshot(
    q,
    (snap) => callback(snap.docs.map(d => ({ id: d.id, ...d.data() })) as ScoutingReport[]),
    async (err) => errorEmitter.emit('permission-error', new FirestorePermissionError({ path: colRef.path, operation: 'list' }))
  );
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

export function subscribeToGlobalReports(callback: (reports: ScoutingReport[]) => void) {
  const colRef = collection(db, "reports");
  return onSnapshot(
    colRef,
    (snap) => callback(snap.docs.map(d => ({ id: d.id, ...d.data() })) as ScoutingReport[]),
    async (err) => errorEmitter.emit('permission-error', new FirestorePermissionError({ path: colRef.path, operation: 'list' }))
  );
}

/**
 * Agenda de Partidos
 */
export function saveScheduledMatch(matchData: Omit<ScheduledMatch, 'id'>, id?: string): string {
  if (!matchData.scoutId) throw new Error("scoutId required");
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

export function subscribeToGlobalScheduledMatches(callback: (matches: ScheduledMatch[]) => void) {
  const colRef = collection(db, "scheduledMatches");
  return onSnapshot(
    colRef,
    (snap) => callback(snap.docs.map(d => ({ id: d.id, ...d.data() })) as ScheduledMatch[]),
    async (err) => errorEmitter.emit('permission-error', new FirestorePermissionError({ path: colRef.path, operation: 'list' }))
  );
}
