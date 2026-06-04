
import { db } from "@/lib/firebase/config";
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  Timestamp,
  serverTimestamp 
} from "firebase/firestore";
import { Player } from "@/lib/types";

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
  try {
    const docRef = await addDoc(collection(db, "players"), {
      ...playerData,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  } catch (e) {
    console.error("Error adding player: ", e);
    throw e;
  }
}

/**
 * Obtiene todos los jugadores en tiempo real
 */
export function subscribeToPlayers(callback: (players: Player[]) => void) {
  const q = query(collection(db, "players"), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snapshot) => {
    const players = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Player[];
    callback(players);
  });
}

/**
 * Guarda un informe de scouting
 */
export async function saveReport(reportData: Omit<ScoutingReport, 'id'>) {
  try {
    const docRef = await addDoc(collection(db, "reports"), {
      ...reportData,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  } catch (e) {
    console.error("Error adding report: ", e);
    throw e;
  }
}
