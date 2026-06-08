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
import { Player, ScoutingReport, PlayerList, ScheduledMatch, QuickNote } from "@/lib/types";
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

/**
 * Jugadores - Suscripción filtrada por scoutId
 */
export async function savePlayer(playerData: Omit<Player, 'id'>, id?: string) {
  if (id) {
    const docRef = doc(db, "players", id);
    try {
      await updateDoc(docRef, { ...playerData, updatedAt: serverTimestamp() });
      return id;
    } catch (serverError: any) {
      errorEmitter.emit('permission-error', new FirestorePermissionError({ path: docRef.path, operation: 'update', requestResourceData: playerData }));
      throw serverError;
    }
  } else {
    const colRef = collection(db, "players");
    const data = { ...playerData, createdAt: serverTimestamp() };
    try {
      const docRef = await addDoc(colRef, data);
      return docRef.id;
    } catch (serverError: any) {
      errorEmitter.emit('permission-error', new FirestorePermissionError({ path: colRef.path, operation: 'create', requestResourceData: data }));
      throw serverError;
    }
  }
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

export function subscribeToPlayers(scoutId: string | null, callback: (players: Player[]) => void) {
  if (!scoutId) return () => {};
  const colRef = collection(db, "players");
  const q = query(colRef, where("scoutId", "==", scoutId));
  
  return onSnapshot(
    q,
    (snap) => callback(snap.docs.map(d => ({ id: d.id, ...d.data() })) as Player[]),
    async (err) => errorEmitter.emit('permission-error', new FirestorePermissionError({ path: colRef.path, operation: 'list' }))
  );
}

/**
 * Informes - Consulta optimizada
 */
export async function saveReport(reportData: Omit<ScoutingReport, 'id'>, id?: string) {
  if (id) {
    const docRef = doc(db, "reports", id);
    try {
      await updateDoc(docRef, { ...reportData, updatedAt: serverTimestamp() });
    } catch (serverError: any) {
      errorEmitter.emit('permission-error', new FirestorePermissionError({ path: docRef.path, operation: 'update', requestResourceData: reportData }));
      throw serverError;
    }
  } else {
    const colRef = collection(db, "reports");
    const data = { ...reportData, createdAt: serverTimestamp() };
    try {
      await addDoc(colRef, data);
    } catch (serverError: any) {
      errorEmitter.emit('permission-error', new FirestorePermissionError({ path: colRef.path, operation: 'create', requestResourceData: data }));
      throw serverError;
    }
  }
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

export function subscribeToReports(scoutId: string, callback: (reports: ScoutingReport[]) => void) {
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
 * Carteras de Talento (Listas)
 */
export function subscribeToPlayerLists(scoutId: string, callback: (lists: PlayerList[]) => void) {
  if (!scoutId) return () => {};
  const colRef = collection(db, "playerLists");
  const q = query(colRef, where("scoutId", "==", scoutId));
  return onSnapshot(
    q,
    (snap) => callback(snap.docs.map(d => ({ id: d.id, ...d.data() })) as PlayerList[]),
    async (err) => errorEmitter.emit('permission-error', new FirestorePermissionError({ path: colRef.path, operation: 'list' }))
  );
}

/**
 * Agenda de Partidos
 */
export function subscribeToScheduledMatches(scoutId: string, callback: (matches: ScheduledMatch[]) => void) {
  if (!scoutId) return () => {};
  const colRef = collection(db, "scheduledMatches");
  const q = query(colRef, where("scoutId", "==", scoutId));
  return onSnapshot(
    q,
    (snap) => callback(snap.docs.map(d => ({ id: d.id, ...d.data() })) as ScheduledMatch[]),
    async (err) => errorEmitter.emit('permission-error', new FirestorePermissionError({ path: colRef.path, operation: 'list' }))
  );
}

/**
 * Notas Rápidas
 */
export function subscribeToQuickNotes(scoutId: string, callback: (notes: QuickNote[]) => void) {
  if (!scoutId) return () => {};
  const colRef = collection(db, "quickNotes");
  const q = query(colRef, where("scoutId", "==", scoutId));
  return onSnapshot(
    q,
    (snap) => callback(snap.docs.map(d => ({ id: d.id, ...d.data() })) as QuickNote[]),
    async (err) => errorEmitter.emit('permission-error', new FirestorePermissionError({ path: colRef.path, operation: 'list' }))
  );
}