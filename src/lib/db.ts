import Dexie, { Table } from "dexie";
import { HandState, HandSummary, TableState, Player } from "../types";

// Define DB Schema Types
export interface GameSession {
  id: string;
  name: string;
  gameVariant: string;
  startTime: string;
  lastUpdated: string;
  finalPlayers: Player[];
}

export interface SavedGameState {
  id: string; // Always "current-game"
  timestamp: number;
  gameState: string; // JSON stringified Zustand state
}

export interface ArchivedHand {
  id: string;
  sessionId: string;
  handNumber: number;
  timestamp: string;
  summary: HandSummary;
  fullState: HandState;
}

export class PokerDatabase extends Dexie {
  sessions!: Table<GameSession>;
  hands!: Table<ArchivedHand>;
  currentGame!: Table<SavedGameState>;

  constructor() {
    super("PokerCompanionDB");
    this.version(2).stores({
      sessions: "id, startTime, lastUpdated",
      hands: "id, sessionId, handNumber, timestamp",
      currentGame: "id",
    });
  }
}

export const db = new PokerDatabase();

// Helper Functions

export async function clearDatabase() {
  await db.transaction("rw", db.sessions, db.hands, async () => {
    await db.sessions.clear();
    await db.hands.clear();
  });
}

export async function deleteSession(sessionId: string) {
  await db.transaction("rw", db.sessions, db.hands, async () => {
    await db.sessions.delete(sessionId);
    await db.hands.where("sessionId").equals(sessionId).delete();
  });
}

export async function saveSession(state: TableState) {
  try {
    // Get existing session to preserve players who might have left
    const existingSession = await db.sessions.get(state.id);

    // Merge existing players with current players to keep a full roster
    let allPlayers = [...state.players];

    if (existingSession && existingSession.finalPlayers) {
      const currentIds = new Set(state.players.map((p) => p.id));
      const missingPlayers = existingSession.finalPlayers.filter(
        (p) => !currentIds.has(p.id)
      );
      allPlayers = [...allPlayers, ...missingPlayers];
    }

    await db.sessions.put({
      id: state.id,
      name: state.name,
      gameVariant: state.gameVariant,
      startTime: state.createdAt,
      lastUpdated: new Date().toISOString(),
      finalPlayers: allPlayers,
    });
  } catch (error) {
    console.error("Failed to save session:", error);
  }
}

export async function saveHand(
  sessionId: string,
  hand: HandState,
  summary: HandSummary
) {
  try {
    // Ensure session exists/is updated
    await db.sessions.update(sessionId, {
      lastUpdated: new Date().toISOString(),
    });

    await db.hands.put({
      id: summary.id,
      sessionId: sessionId,
      handNumber: hand.handNumber,
      timestamp: summary.createdAt,
      summary: summary,
      fullState: hand,
    });
  } catch (error) {
    console.error("Failed to save hand:", error);
  }
}

export async function getSessions() {
  return await db.sessions.orderBy("lastUpdated").reverse().toArray();
}

export async function getSessionHands(sessionId: string) {
  return await db.hands
    .where("sessionId")
    .equals(sessionId)
    .sortBy("handNumber");
}
